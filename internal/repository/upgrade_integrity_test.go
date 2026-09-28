package repository_test

import (
	"database/sql"
	"fmt"
	"path/filepath"
	"strings"
	"testing"

	"hogar-contable/internal/core"
	"hogar-contable/internal/database"
	"hogar-contable/internal/repository"
	"hogar-contable/internal/service"
)

// Empirical upgrade-integrity proof: a database written by the pre-fix
// binary (which could leave orphan movements and dangling references,
// because its PRAGMA foreign_keys only reached one pooled connection)
// must survive the new binary untouched.
//
// The fixture is seeded through a plain connection with NO foreign key
// enforcement — exactly how the old binary wrote — then reopened with the
// current code (DSN pragma on every connection, transactional deletes,
// USDT-based withdraw validation) and every write path is exercised.
// Every pre-existing row must come out identical.

func snapshotRows(t *testing.T, conn *sql.DB, table string) []string {
	t.Helper()
	rows, err := conn.Query(fmt.Sprintf("SELECT * FROM %s ORDER BY rowid", table))
	if err != nil {
		t.Fatalf("snapshot %s: %v", table, err)
	}
	defer rows.Close()
	cols, err := rows.Columns()
	if err != nil {
		t.Fatalf("columns %s: %v", table, err)
	}
	vals := make([]any, len(cols))
	ptrs := make([]any, len(cols))
	for i := range vals {
		ptrs[i] = &vals[i]
	}
	var out []string
	for rows.Next() {
		if err := rows.Scan(ptrs...); err != nil {
			t.Fatalf("scan %s: %v", table, err)
		}
		parts := make([]string, len(cols))
		for i, v := range vals {
			switch b := v.(type) {
			case nil:
				parts[i] = "NULL"
			case []byte:
				parts[i] = string(b)
			default:
				parts[i] = fmt.Sprintf("%v", v)
			}
		}
		out = append(out, strings.Join(parts, "|"))
	}
	return out
}

func countOrphans(t *testing.T, conn *sql.DB) int {
	t.Helper()
	var n int
	err := conn.QueryRow(`SELECT COUNT(*) FROM saving_movements m
		LEFT JOIN saving_accounts a ON m.account_id = a.id
		WHERE a.id IS NULL`).Scan(&n)
	if err != nil {
		t.Fatalf("count orphans: %v", err)
	}
	return n
}

func TestPreFixData_SurvivesNewBinary(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "legacy.db")

	// Phase 1: create the schema (identical between old and new binaries).
	schemaDB, err := database.Open(dbPath)
	if err != nil {
		t.Fatalf("create schema: %v", err)
	}
	schemaDB.Close()

	// Phase 2: write legacy data the way the pre-fix binary did — a plain
	// connection with NO foreign key enforcement.
	legacy, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open legacy connection: %v", err)
	}
	defer legacy.Close()

	seed := []string{
		`INSERT INTO transactions (type, description, amount_bs, amount_usd_bcv, amount_usdt, rate_official, rate_p2p, category_id, date)
		 VALUES ('income','Salario julio',17100,95,90,180,190,15,'2026-07-05')`,
		`INSERT INTO transactions (type, description, amount_bs, amount_usd_bcv, amount_usdt, rate_official, rate_p2p, category_id, date)
		 VALUES ('expense','Mercado julio',5700,31.67,30,180,190,1,'2026-07-08')`,
		`INSERT INTO saving_accounts (name, description) VALUES ('Banco viejo','cuenta de la era pre-fix')`,
		`INSERT INTO saving_movements (account_id, type, amount_usd, amount_usdt, amount_bs, description, date)
		 VALUES (1,'deposit',15,10,2850,'deposito con tasa vieja 1.5','2026-07-10')`,
		`INSERT INTO saving_movements (account_id, type, amount_usd, amount_usdt, amount_bs, description, date)
		 VALUES (1,'deposit',7.5,5,1425,'','2026-07-12')`,
		// Orphan: its account was deleted by the pre-fix binary delete bug.
		`INSERT INTO saving_movements (account_id, type, amount_usd, amount_usdt, amount_bs, description, date)
		 VALUES (4242,'withdraw',900,600,114000,'retiro de cuenta ya borrada','2026-07-15')`,
		// Dangling reference: the income transaction it created was later
		// deleted while FK enforcement was off.
		`INSERT INTO saving_movements (account_id, type, amount_usd, amount_usdt, amount_bs, description, date, created_transaction_id)
		 VALUES (1,'deposit',3,2,570,'deposito con ingreso borrado','2026-07-20',777)`,
		`INSERT INTO categories (name, type, is_default) VALUES ('Freelance','income',0)`,
	}
	for _, q := range seed {
		if _, err := legacy.Exec(q); err != nil {
			t.Fatalf("seed legacy data: %v\nSQL: %s", err, q)
		}
	}

	// Locate the dangling-reference movement by its description.
	var danglingID int64
	if err := legacy.QueryRow(`SELECT id FROM saving_movements WHERE description='deposito con ingreso borrado'`).Scan(&danglingID); err != nil {
		t.Fatalf("find dangling movement: %v", err)
	}

	// Frozen snapshot of all pre-existing data.
	tables := []string{"transactions", "categories", "saving_accounts", "saving_movements", "exchange_rates"}
	before := map[string][]string{}
	for _, tbl := range tables {
		before[tbl] = snapshotRows(t, legacy, tbl)
	}
	if orphans := countOrphans(t, legacy); orphans != 1 {
		t.Fatalf("fixture must contain exactly 1 orphan, got %d", orphans)
	}

	// Phase 3: reopen with the NEW code. The DSN pragma enforces FKs on
	// every connection; opening a file that already contains orphans and
	// dangling refs must still succeed (FKs are not validated retroactively).
	db, err := database.Open(dbPath)
	if err != nil {
		t.Fatalf("new binary must open legacy data: %v", err)
	}
	defer db.Close()

	txRepo := repository.NewTransactionRepo(db.DB)
	catRepo := repository.NewCategoryRepo(db.DB)
	accRepo := repository.NewSavingAccountRepo(db.DB)
	movRepo := repository.NewSavingMovementRepo(db.DB)
	savingSvc := service.NewSavingService(accRepo, movRepo, service.NewTransactionService(txRepo, catRepo))

	// 3a. Reads on legacy data: July list returns the two legacy transactions.
	july, err := txRepo.List("2026-07-01", "2026-07-31", "")
	if err != nil {
		t.Fatalf("list legacy transactions: %v", err)
	}
	if len(july) != 2 {
		t.Fatalf("expected 2 legacy transactions, got %d", len(july))
	}
	if july[0].AmountUsdt != 90 && july[1].AmountUsdt != 90 {
		t.Errorf("legacy USDT amount 90 not found in list")
	}

	// 3b. Balances derived from legacy movements: 10+5+2 USDT frozen at
	// entry-time rates.
	usd, usdt, bs, err := accRepo.GetBalance(1)
	if err != nil {
		t.Fatalf("legacy balance: %v", err)
	}
	if usdt != 17 || usd != 25.5 || bs != 4845 {
		t.Errorf("legacy balance: got usd=%v usdt=%v bs=%v, want 25.5/17/4845", usd, usdt, bs)
	}

	// 3c. Mixed-rates withdrawal — the reported bug scenario: withdraw the
	// full USDT balance at a rate ratio that inflates today's USD figure
	// (40 > balance_usd 25.5). The old USD check rejected this; the new
	// USDT check must allow it.
	movID, err := savingSvc.Withdraw(service.WithdrawInput{
		AccountID: 1, AmountUsd: 40, AmountUsdt: 17, AmountBs: 20000,
	})
	if err != nil {
		t.Fatalf("full-balance withdrawal on legacy data must succeed, got: %v", err)
	}
	if movID == 0 {
		t.Fatal("expected movement id, got 0")
	}
	if _, usdtAfter, _, err := accRepo.GetBalance(1); err != nil || usdtAfter != 0 {
		t.Errorf("expected 0 USDT balance after full withdrawal, got %v (err=%v)", usdtAfter, err)
	}

	// 3d. Editing the movement with a pre-existing dangling
	// created_transaction_id must keep working, and must preserve the old
	// reference untouched (Update does not touch that column).
	if err := movRepo.Update(&core.SavingMovement{
		ID: danglingID, AmountUsd: 3, AmountUsdt: 2, AmountBs: 570,
		Description: "deposito con ingreso borrado (editado)", Date: "2026-07-20",
	}); err != nil {
		t.Fatalf("editing movement with dangling legacy ref must work, got: %v", err)
	}
	var ref sql.NullInt64
	if err := db.QueryRow(`SELECT created_transaction_id FROM saving_movements WHERE id=?`, danglingID).Scan(&ref); err != nil {
		t.Fatalf("read dangling ref: %v", err)
	}
	if !ref.Valid || ref.Int64 != 777 {
		t.Errorf("dangling legacy ref must stay untouched, got %v", ref)
	}

	// 3e. Deleting a category that legacy transactions still use must now
	// REFUSE. The old binary silently left transactions pointing at a
	// nonexistent category; the new FK enforcement blocks the corruption.
	if err := catRepo.Delete(15); err == nil {
		t.Fatal("deleting an in-use category must fail with FKs enforced, got nil")
	}
	cats, err := catRepo.List("income")
	if err != nil {
		t.Fatalf("list categories: %v", err)
	}
	found := false
	for _, c := range cats {
		if c.ID == 15 {
			found = true
		}
	}
	if !found {
		t.Error("category 15 must still exist after the refused delete")
	}

	// 3f. Fresh writes on the upgraded database.
	newTxID, err := txRepo.Create(&core.Transaction{
		Type: core.Income, Description: "ingreso post-upgrade",
		AmountBs: 1710, AmountUsdBcv: 9.5, AmountUsdt: 9,
		RateOfficial: 180, RateP2P: 190, Date: "2026-09-28",
	})
	if err != nil || newTxID == 0 {
		t.Errorf("new transaction on legacy db: id=%d err=%v", newTxID, err)
	}

	// Phase 4: preservation — every pre-existing row identical, except the
	// intentionally edited movement (description only) and pure appends.
	for _, tbl := range tables {
		after := snapshotRows(t, db.DB, tbl)
		switch tbl {
		case "transactions":
			// 2 legacy rows + 1 append
			if len(after) != len(before[tbl])+1 {
				t.Errorf("transactions: expected 1 append, before=%d after=%d", len(before[tbl]), len(after))
			}
			for i, row := range before[tbl] {
				if after[i] != row {
					t.Errorf("transactions row %d changed:\n  before: %s\n  after:  %s", i, row, after[i])
				}
			}
		case "saving_movements":
			// 4 legacy rows: 3 identical, 1 with edited description; +1 append.
			if len(after) != len(before[tbl])+1 {
				t.Errorf("saving_movements: expected 1 append, before=%d after=%d", len(before[tbl]), len(after))
			}
			for i, row := range before[tbl] {
				afterRow := after[i]
				if afterRow == row {
					continue
				}
				if i != int(danglingID)-1 {
					t.Errorf("saving_movements row %d changed:\n  before: %s\n  after:  %s", i, row, afterRow)
				}
			}
		default:
			// categories, saving_accounts, exchange_rates: byte-identical.
			if len(after) != len(before[tbl]) {
				t.Errorf("%s: row count changed, before=%d after=%d", tbl, len(before[tbl]), len(after))
			}
			for i, row := range before[tbl] {
				if after[i] != row {
					t.Errorf("%s row %d changed:\n  before: %s\n  after:  %s", tbl, i, row, after[i])
				}
			}
		}
	}

	// The old binary's orphan is still there: the new code does not silently
	// delete or rewrite legacy garbage either — history stays untouched.
	if orphans := countOrphans(t, db.DB); orphans != 1 {
		t.Errorf("legacy orphan must remain untouched, got %d", orphans)
	}
}
