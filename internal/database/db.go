package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	_ "modernc.org/sqlite"
)

type DB struct {
	*sql.DB
	Path string
}

// Open opens (or creates) the SQLite database and runs migrations.
func Open(dbPath string) (*DB, error) {
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("create db directory: %w", err)
	}

	conn, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}

	// WAL mode for better concurrent reads
	if _, err := conn.Exec("PRAGMA journal_mode=WAL"); err != nil {
		return nil, fmt.Errorf("set WAL mode: %w", err)
	}

	// Enable foreign keys
	if _, err := conn.Exec("PRAGMA foreign_keys=ON"); err != nil {
		return nil, fmt.Errorf("enable foreign keys: %w", err)
	}

	db := &DB{DB: conn, Path: dbPath}
	if err := db.migrate(); err != nil {
		return nil, fmt.Errorf("migrate: %w", err)
	}

	return db, nil
}

func (db *DB) migrate() error {
	migrations := []string{
		`CREATE TABLE IF NOT EXISTS categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			type TEXT NOT NULL CHECK(type IN ('income','expense')),
			is_default INTEGER NOT NULL DEFAULT 0
		)`,
		`CREATE TABLE IF NOT EXISTS transactions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			type TEXT NOT NULL CHECK(type IN ('income','expense')),
			description TEXT NOT NULL,
			amount_bs REAL NOT NULL DEFAULT 0,
			amount_usd_bcv REAL NOT NULL DEFAULT 0,
			amount_usdt REAL NOT NULL DEFAULT 0,
			rate_official REAL NOT NULL DEFAULT 0,
			rate_p2p REAL NOT NULL DEFAULT 0,
			category_id INTEGER,
			date TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
			FOREIGN KEY (category_id) REFERENCES categories(id)
		)`,
		`CREATE TABLE IF NOT EXISTS closures (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			type TEXT NOT NULL CHECK(type IN ('daily','monthly','yearly')),
			period TEXT NOT NULL,
			total_income REAL NOT NULL DEFAULT 0,
			total_expenses REAL NOT NULL DEFAULT 0,
			balance REAL NOT NULL DEFAULT 0,
			closed_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
		)`,
		`CREATE TABLE IF NOT EXISTS exchange_rates (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			type TEXT NOT NULL CHECK(type IN ('official','p2p')),
			value REAL NOT NULL,
			source TEXT NOT NULL DEFAULT '',
			created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
		)`,
		`CREATE UNIQUE INDEX IF NOT EXISTS idx_closure_period ON closures(type, period)`,
		`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`,
		`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)`,
		`CREATE INDEX IF NOT EXISTS idx_exchange_rates_type ON exchange_rates(type)`,

		// Migrate existing tables: add new columns safely
		`ALTER TABLE transactions ADD COLUMN amount_usd_bcv REAL NOT NULL DEFAULT 0`,
		`ALTER TABLE transactions ADD COLUMN amount_usdt REAL NOT NULL DEFAULT 0`,
		`ALTER TABLE transactions ADD COLUMN rate_official REAL NOT NULL DEFAULT 0`,
		`ALTER TABLE transactions ADD COLUMN rate_p2p REAL NOT NULL DEFAULT 0`,

		// Seed default categories (refresh on each startup)
		`DELETE FROM categories WHERE is_default=1`,
		`INSERT INTO categories(name, type, is_default) VALUES
			('Mercado', 'expense', 1),
			('Alquiler', 'expense', 1),
			('Efectivo', 'expense', 1),
			('Reparación hogar', 'expense', 1),
			('Gastos auto', 'expense', 1),
			('Salidas', 'expense', 1),
			('Servicios (teléfonos)', 'expense', 1),
			('Servicios (internet)', 'expense', 1),
			('Servicios (suscripciones)', 'expense', 1),
			('Gastos médicos', 'expense', 1),
			('Corte de cabello', 'expense', 1),
			('Deporte', 'expense', 1),
			('Compra muebles/inmuebles/ropa', 'expense', 1),
			('Gasto mascota', 'expense', 1),
			('Salario (Juan)', 'income', 1),
			('Salario (Nardy)', 'income', 1),
			('Ingresos extras', 'income', 1)`,
	}

	for _, m := range migrations {
		if _, err := db.Exec(m); err != nil {
			// Ignore "duplicate column" errors for ALTER TABLE
			if strings.HasPrefix(m, "ALTER TABLE") && strings.Contains(err.Error(), "duplicate column") {
				log.Printf("Skipping (already applied): %s", m[:60])
				continue
			}
			return fmt.Errorf("migration failed: %w\nSQL: %s", err, m)
		}
	}

	return nil
}
