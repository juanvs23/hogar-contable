package service

import (
	"testing"

	"hogar-contable/internal/core"
)

// mockTxRepo implements repository.TransactionRepository for testing
type mockTxRepo struct {
	createFn func(tx *core.Transaction) (int64, error)
}

func (m *mockTxRepo) Create(tx *core.Transaction) (int64, error) {
	if m.createFn != nil {
		return m.createFn(tx)
	}
	return 1, nil
}

func (m *mockTxRepo) GetByID(id int64) (*core.Transaction, error) {
	return &core.Transaction{ID: id}, nil
}

func (m *mockTxRepo) List(dateFrom, dateTo, txType string) ([]core.Transaction, error) {
	return []core.Transaction{}, nil
}

func (m *mockTxRepo) Update(tx *core.Transaction) error {
	return nil
}

func (m *mockTxRepo) Delete(id int64) error {
	return nil
}

func (m *mockTxRepo) GetTotals(dateFrom, dateTo string) (incomeBs, expensesBs, incomeUsd, expensesUsd, incomeUsdt, expensesUsdt float64, err error) {
	return 0, 0, 0, 0, 0, 0, nil
}

func (m *mockTxRepo) GetCategoryTotals(dateFrom, dateTo string, txType string) ([]core.CategoryTotal, error) {
	return []core.CategoryTotal{}, nil
}

type mockCatRepo struct{}

func (m *mockCatRepo) Create(cat *core.Category) (int64, error) { return 1, nil }
func (m *mockCatRepo) Update(cat *core.Category) error          { return nil }
func (m *mockCatRepo) List(txType string) ([]core.Category, error) {
	return []core.Category{}, nil
}
func (m *mockCatRepo) Delete(id int64) error { return nil }

func TestCreateTransaction_ValidInput(t *testing.T) {
	svc := NewTransactionService(&mockTxRepo{}, &mockCatRepo{})

	id, err := svc.Create(&core.Transaction{
		Type:        core.Expense,
		Description: "Mercado semanal",
		AmountBs:    250.00,
		Date:        "2026-06-01",
	})

	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
	if id != 1 {
		t.Errorf("expected id 1, got %d", id)
	}
}

func TestCreateTransaction_EmptyDescription(t *testing.T) {
	svc := NewTransactionService(&mockTxRepo{}, &mockCatRepo{})

	_, err := svc.Create(&core.Transaction{
		Type:     core.Expense,
		AmountBs: 100,
	})

	if err == nil {
		t.Error("expected error for empty description, got nil")
	}
}

func TestCreateTransaction_InvalidType(t *testing.T) {
	svc := NewTransactionService(&mockTxRepo{}, &mockCatRepo{})

	_, err := svc.Create(&core.Transaction{
		Type:        "invalid",
		Description: "Test",
		AmountBs:    100,
	})

	if err == nil {
		t.Error("expected error for invalid type, got nil")
	}
}

func TestCreateTransaction_NoAmount(t *testing.T) {
	svc := NewTransactionService(&mockTxRepo{}, &mockCatRepo{})

	_, err := svc.Create(&core.Transaction{
		Type:        core.Expense,
		Description: "Sin monto",
		AmountBs:    0,
	})

	if err == nil {
		t.Error("expected error for zero amount, got nil")
	}
}

func TestCreateTransaction_DefaultsDate(t *testing.T) {
	svc := NewTransactionService(&mockTxRepo{
		createFn: func(tx *core.Transaction) (int64, error) {
			if tx.Date == "" {
				t.Error("expected date to be set, got empty")
			}
			return 1, nil
		},
	}, &mockCatRepo{})

	svc.Create(&core.Transaction{
		Type:        core.Income,
		Description: "Salario",
		AmountBs:    1000,
	})
}
