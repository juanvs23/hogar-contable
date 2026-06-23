package repository

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"hogar-contable/internal/core"
)

type SQLiteTransactionRepo struct {
	db *sql.DB
}

func NewTransactionRepo(db *sql.DB) TransactionRepository {
	return &SQLiteTransactionRepo{db: db}
}

func (r *SQLiteTransactionRepo) Create(tx *core.Transaction) (int64, error) {
	if tx.Date == "" {
		tx.Date = time.Now().Format("2006-01-02")
	}
	result, err := r.db.Exec(
		`INSERT INTO transactions (type, description, amount_bs, amount_usd_bcv, amount_usdt, rate_official, rate_p2p, category_id, date)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		tx.Type, tx.Description, tx.AmountBs, tx.AmountUsdBcv, tx.AmountUsdt, tx.RateOfficial, tx.RateP2P, tx.CategoryID, tx.Date,
	)
	if err != nil {
		return 0, fmt.Errorf("create transaction: %w", err)
	}
	return result.LastInsertId()
}

func (r *SQLiteTransactionRepo) GetByID(id int64) (*core.Transaction, error) {
	row := r.db.QueryRow(
		`SELECT id, type, description, amount_bs, amount_usd_bcv, amount_usdt, rate_official, rate_p2p, category_id, date, created_at
		 FROM transactions WHERE id = ?`, id,
	)
	tx := &core.Transaction{}
	err := row.Scan(&tx.ID, &tx.Type, &tx.Description, &tx.AmountBs, &tx.AmountUsdBcv, &tx.AmountUsdt, &tx.RateOfficial, &tx.RateP2P, &tx.CategoryID, &tx.Date, &tx.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("get transaction %d: %w", id, err)
	}
	return tx, nil
}

func (r *SQLiteTransactionRepo) List(dateFrom, dateTo string, txType string) ([]core.Transaction, error) {
	query := `SELECT id, type, description, amount_bs, amount_usd_bcv, amount_usdt, rate_official, rate_p2p, category_id, date, created_at
		FROM transactions WHERE 1=1`
	var args []any

	if dateFrom != "" {
		query += " AND date >= ?"
		args = append(args, dateFrom)
	}
	if dateTo != "" {
		query += " AND date <= ?"
		args = append(args, dateTo)
	}
	if txType != "" {
		query += " AND type = ?"
		args = append(args, txType)
	}
	query += " ORDER BY date DESC, created_at DESC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("list transactions: %w", err)
	}
	defer rows.Close()

	transactions := make([]core.Transaction, 0)
	for rows.Next() {
		var t core.Transaction
		if err := rows.Scan(&t.ID, &t.Type, &t.Description, &t.AmountBs, &t.AmountUsdBcv, &t.AmountUsdt, &t.RateOfficial, &t.RateP2P, &t.CategoryID, &t.Date, &t.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan transaction: %w", err)
		}
		transactions = append(transactions, t)
	}
	return transactions, nil
}

func (r *SQLiteTransactionRepo) Update(tx *core.Transaction) error {
	_, err := r.db.Exec(
		`UPDATE transactions SET type=?, description=?, amount_bs=?, amount_usd_bcv=?, amount_usdt=?, rate_official=?, rate_p2p=?, category_id=?, date=?
		 WHERE id=?`,
		tx.Type, tx.Description, tx.AmountBs, tx.AmountUsdBcv, tx.AmountUsdt, tx.RateOfficial, tx.RateP2P, tx.CategoryID, tx.Date, tx.ID,
	)
	if err != nil {
		return fmt.Errorf("update transaction %d: %w", tx.ID, err)
	}
	return nil
}

func (r *SQLiteTransactionRepo) Delete(id int64) error {
	_, err := r.db.Exec(`DELETE FROM transactions WHERE id=?`, id)
	if err != nil {
		return fmt.Errorf("delete transaction %d: %w", id, err)
	}
	return nil
}

func (r *SQLiteTransactionRepo) GetTotals(dateFrom, dateTo string) (income, expenses float64, err error) {
	query := `SELECT type, COALESCE(SUM(amount_bs), 0) FROM transactions WHERE 1=1`
	var args []any

	if dateFrom != "" {
		query += " AND date >= ?"
		args = append(args, dateFrom)
	}
	if dateTo != "" {
		query += " AND date <= ?"
		args = append(args, dateTo)
	}
	query += " GROUP BY type"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return 0, 0, fmt.Errorf("get totals: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var tType string
		var total float64
		if err := rows.Scan(&tType, &total); err != nil {
			return 0, 0, fmt.Errorf("scan total: %w", err)
		}
		switch tType {
		case "income":
			income = total
		case "expense":
			expenses = total
		}
	}
	return income, expenses, nil
}

type SQLiteCategoryRepo struct {
	db *sql.DB
}

func NewCategoryRepo(db *sql.DB) CategoryRepository {
	return &SQLiteCategoryRepo{db: db}
}

func (r *SQLiteCategoryRepo) Create(cat *core.Category) (int64, error) {
	result, err := r.db.Exec(
		`INSERT INTO categories (name, type) VALUES (?, ?)`,
		cat.Name, cat.Type,
	)
	if err != nil {
		return 0, fmt.Errorf("create category: %w", err)
	}
	return result.LastInsertId()
}

func (r *SQLiteCategoryRepo) List(txType string) ([]core.Category, error) {
	query := `SELECT id, name, type, is_default FROM categories WHERE 1=1`
	var args []any
	if txType != "" {
		query += " AND type = ?"
		args = append(args, txType)
	}
	query += " ORDER BY type, name"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("list categories: %w", err)
	}
	defer rows.Close()

	cats := make([]core.Category, 0)
	for rows.Next() {
		var c core.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Type, &c.IsDefault); err != nil {
			return nil, fmt.Errorf("scan category: %w", err)
		}
		// IsDefault is already populated by Scan
		cats = append(cats, c)
	}
	return cats, nil
}

func (r *SQLiteCategoryRepo) Update(cat *core.Category) error {
	_, err := r.db.Exec(
		`UPDATE categories SET name=?, type=? WHERE id=?`,
		cat.Name, cat.Type, cat.ID,
	)
	if err != nil {
		return fmt.Errorf("update category %d: %w", cat.ID, err)
	}
	return nil
}

func (r *SQLiteCategoryRepo) Delete(id int64) error {
	_, err := r.db.Exec(`DELETE FROM categories WHERE id=?`, id)
	if err != nil {
		return fmt.Errorf("delete category %d: %w", id, err)
	}
	return nil
}

type SQLiteClosureRepo struct {
	db *sql.DB
}

func NewClosureRepo(db *sql.DB) ClosureRepository {
	return &SQLiteClosureRepo{db: db}
}

func (r *SQLiteClosureRepo) Create(cl *core.Closure) (int64, error) {
	result, err := r.db.Exec(
		`INSERT OR REPLACE INTO closures (type, period, total_income, total_expenses, balance)
		 VALUES (?, ?, ?, ?, ?)`,
		cl.Type, cl.Period, cl.TotalIncome, cl.TotalExpenses, cl.Balance,
	)
	if err != nil {
		return 0, fmt.Errorf("create closure: %w", err)
	}
	return result.LastInsertId()
}

func (r *SQLiteClosureRepo) GetByPeriod(period string, clType core.ClosureType) (*core.Closure, error) {
	row := r.db.QueryRow(
		`SELECT id, type, period, total_income, total_expenses, balance, closed_at
		 FROM closures WHERE type=? AND period=?`, clType, period,
	)
	cl := &core.Closure{}
	err := row.Scan(&cl.ID, &cl.Type, &cl.Period, &cl.TotalIncome, &cl.TotalExpenses, &cl.Balance, &cl.ClosedAt)
	if err != nil {
		return nil, fmt.Errorf("get closure: %w", err)
	}
	return cl, nil
}

func (r *SQLiteClosureRepo) List(limit int) ([]core.Closure, error) {
	if limit <= 0 {
		limit = 12
	}
	rows, err := r.db.Query(
		`SELECT id, type, period, total_income, total_expenses, balance, closed_at
		 FROM closures ORDER BY period DESC LIMIT ?`, limit,
	)
	if err != nil {
		return nil, fmt.Errorf("list closures: %w", err)
	}
	defer rows.Close()

	closures := make([]core.Closure, 0)
	for rows.Next() {
		var c core.Closure
		if err := rows.Scan(&c.ID, &c.Type, &c.Period, &c.TotalIncome, &c.TotalExpenses, &c.Balance, &c.ClosedAt); err != nil {
			return nil, fmt.Errorf("scan closure: %w", err)
		}
		closures = append(closures, c)
	}
	return closures, nil
}

type SQLiteExchangeRateRepo struct {
	db *sql.DB
}

func NewExchangeRateRepo(db *sql.DB) ExchangeRateRepository {
	return &SQLiteExchangeRateRepo{db: db}
}

func (r *SQLiteExchangeRateRepo) Save(rate *core.ExchangeRate) (int64, error) {
	result, err := r.db.Exec(
		`INSERT INTO exchange_rates (type, value, source) VALUES (?, ?, ?)`,
		rate.Type, rate.Value, rate.Source,
	)
	if err != nil {
		return 0, fmt.Errorf("save exchange rate: %w", err)
	}
	return result.LastInsertId()
}

func (r *SQLiteExchangeRateRepo) GetLatest(rateType core.RateType) (*core.ExchangeRate, error) {
	row := r.db.QueryRow(
		`SELECT id, type, value, source, created_at
		 FROM exchange_rates WHERE type=? ORDER BY created_at DESC LIMIT 1`,
		rateType,
	)
	rate := &core.ExchangeRate{}
	err := row.Scan(&rate.ID, &rate.Type, &rate.Value, &rate.Source, &rate.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("get latest exchange rate: %w", err)
	}
	return rate, nil
}

func (r *SQLiteExchangeRateRepo) GetHistory(rateType core.RateType, limit int) ([]core.ExchangeRate, error) {
	if limit <= 0 {
		limit = 30
	}
	rows, err := r.db.Query(
		`SELECT id, type, value, source, created_at
		 FROM exchange_rates WHERE type=? ORDER BY created_at DESC LIMIT ?`,
		rateType, limit,
	)
	if err != nil {
		return nil, fmt.Errorf("get exchange rate history: %w", err)
	}
	defer rows.Close()

	rates := make([]core.ExchangeRate, 0)
	for rows.Next() {
		var r core.ExchangeRate
		if err := rows.Scan(&r.ID, &r.Type, &r.Value, &r.Source, &r.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan exchange rate: %w", err)
		}
		rates = append(rates, r)
	}
	return rates, nil
}

// Helper to scan nullable values
func scanNullableString(ns sql.NullString) *string {
	if ns.Valid {
		return &ns.String
	}
	return nil
}

// Ensure strings import is used
var _ = strings.TrimSpace
