package service

import (
	"fmt"
	"time"

	"hogar-contable/internal/core"
	"hogar-contable/internal/repository"
)

type TransactionService struct {
	txRepo  repository.TransactionRepository
	catRepo repository.CategoryRepository
}

func NewTransactionService(txRepo repository.TransactionRepository, catRepo repository.CategoryRepository) *TransactionService {
	return &TransactionService{txRepo: txRepo, catRepo: catRepo}
}

func (s *TransactionService) Create(tx *core.Transaction) (int64, error) {
	if tx.Description == "" {
		return 0, fmt.Errorf("description is required")
	}
	if tx.AmountBs <= 0 && tx.AmountUsdBcv <= 0 && tx.AmountUsdt <= 0 {
		return 0, fmt.Errorf("at least one amount must be greater than 0")
	}
	if tx.Type != core.Income && tx.Type != core.Expense {
		return 0, fmt.Errorf("invalid transaction type: %s", tx.Type)
	}
	if tx.Date == "" {
		tx.Date = time.Now().Format("2006-01-02")
	}
	return s.txRepo.Create(tx)
}

func (s *TransactionService) GetByID(id int64) (*core.Transaction, error) {
	return s.txRepo.GetByID(id)
}

func (s *TransactionService) List(dateFrom, dateTo, txType string) ([]core.Transaction, error) {
	return s.txRepo.List(dateFrom, dateTo, txType)
}

func (s *TransactionService) Update(tx *core.Transaction) error {
	return s.txRepo.Update(tx)
}

func (s *TransactionService) Delete(id int64) error {
	return s.txRepo.Delete(id)
}

type MonthlySummary struct {
	Month             string  `json:"month"`
	TotalIncomeBs     float64 `json:"total_income_bs"`
	TotalExpensesBs   float64 `json:"total_expenses_bs"`
	BalanceBs         float64 `json:"balance_bs"`
	TotalIncomeUsd    float64 `json:"total_income_usd"`
	TotalExpensesUsd  float64 `json:"total_expenses_usd"`
	BalanceUsd        float64 `json:"balance_usd"`
	TotalIncomeUsdt   float64 `json:"total_income_usdt"`
	TotalExpensesUsdt float64 `json:"total_expenses_usdt"`
	BalanceUsdt       float64 `json:"balance_usdt"`
}

func (s *TransactionService) GetMonthlySummary(year, month string) (*MonthlySummary, error) {
	dateFrom := fmt.Sprintf("%s-%s-01", year, month)
	t, err := time.Parse("2006-01-02", dateFrom)
	if err != nil {
		return nil, fmt.Errorf("invalid date: %w", err)
	}
	lastDay := t.AddDate(0, 1, -1)
	dateTo := lastDay.Format("2006-01-02")

	incomeBs, expensesBs, incomeUsd, expensesUsd, incomeUsdt, expensesUsdt, err := s.txRepo.GetTotals(dateFrom, dateTo)
	if err != nil {
		return nil, fmt.Errorf("get totals: %w", err)
	}

	return &MonthlySummary{
		Month:             fmt.Sprintf("%s-%s", year, month),
		TotalIncomeBs:     incomeBs,
		TotalExpensesBs:   expensesBs,
		BalanceBs:         incomeBs - expensesBs,
		TotalIncomeUsd:    incomeUsd,
		TotalExpensesUsd:  expensesUsd,
		BalanceUsd:        incomeUsd - expensesUsd,
		TotalIncomeUsdt:   incomeUsdt,
		TotalExpensesUsdt: expensesUsdt,
		BalanceUsdt:       incomeUsdt - expensesUsdt,
	}, nil
}

func (s *TransactionService) GetYearlySummary(year string) (*MonthlySummary, error) {
	dateFrom := fmt.Sprintf("%s-01-01", year)
	dateTo := fmt.Sprintf("%s-12-31", year)

	incomeBs, expensesBs, incomeUsd, expensesUsd, incomeUsdt, expensesUsdt, err := s.txRepo.GetTotals(dateFrom, dateTo)
	if err != nil {
		return nil, fmt.Errorf("get yearly totals: %w", err)
	}

	return &MonthlySummary{
		Month:             year,
		TotalIncomeBs:     incomeBs,
		TotalExpensesBs:   expensesBs,
		BalanceBs:         incomeBs - expensesBs,
		TotalIncomeUsd:    incomeUsd,
		TotalExpensesUsd:  expensesUsd,
		BalanceUsd:        incomeUsd - expensesUsd,
		TotalIncomeUsdt:   incomeUsdt,
		TotalExpensesUsdt: expensesUsdt,
		BalanceUsdt:       incomeUsdt - expensesUsdt,
	}, nil
}

func (s *TransactionService) GetExpensesByCategory(year, month string) ([]core.CategoryTotal, error) {
	dateFrom := fmt.Sprintf("%s-%s-01", year, month)
	t, err := time.Parse("2006-01-02", dateFrom)
	if err != nil {
		return nil, fmt.Errorf("invalid date: %w", err)
	}
	lastDay := t.AddDate(0, 1, -1)
	dateTo := lastDay.Format("2006-01-02")

	return s.txRepo.GetCategoryTotals(dateFrom, dateTo, "expense")
}

func (s *TransactionService) GetIncomeByCategory(year, month string) ([]core.CategoryTotal, error) {
	dateFrom := fmt.Sprintf("%s-%s-01", year, month)
	t, err := time.Parse("2006-01-02", dateFrom)
	if err != nil {
		return nil, fmt.Errorf("invalid date: %w", err)
	}
	lastDay := t.AddDate(0, 1, -1)
	dateTo := lastDay.Format("2006-01-02")

	return s.txRepo.GetCategoryTotals(dateFrom, dateTo, "income")
}

// GetCategories returns all categories filtered by type (income/expense).
func (s *TransactionService) GetCategories(txType string) ([]core.Category, error) {
	return s.catRepo.List(txType)
}

// CreateCategory creates a custom category.
func (s *TransactionService) CreateCategory(cat *core.Category) (int64, error) {
	return s.catRepo.Create(cat)
}

// UpdateCategory updates a category name and type.
func (s *TransactionService) UpdateCategory(cat *core.Category) error {
	return s.catRepo.Update(cat)
}

// DeleteCategory deletes a category.
func (s *TransactionService) DeleteCategory(id int64) error {
	return s.catRepo.Delete(id)
}
