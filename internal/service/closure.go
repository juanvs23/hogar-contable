package service

import (
	"fmt"
	"time"

	"hogar-contable/internal/core"
	"hogar-contable/internal/repository"
)

type ClosureService struct {
	txRepo     repository.TransactionRepository
	closureRepo repository.ClosureRepository
}

func NewClosureService(txRepo repository.TransactionRepository, closureRepo repository.ClosureRepository) *ClosureService {
	return &ClosureService{txRepo: txRepo, closureRepo: closureRepo}
}

type ClosureResult struct {
	Month        string  `json:"month"`
	TotalIncomeBs     float64 `json:"total_income_bs"`
	TotalExpensesBs   float64 `json:"total_expenses_bs"`
	BalanceBs         float64 `json:"balance_bs"`
	TotalIncomeUsd    float64 `json:"total_income_usd"`
	TotalExpensesUsd  float64 `json:"total_expenses_usd"`
	BalanceUsd        float64 `json:"balance_usd"`
	TotalIncomeUsdt   float64 `json:"total_income_usdt"`
	TotalExpensesUsdt float64 `json:"total_expenses_usdt"`
	BalanceUsdt       float64 `json:"balance_usdt"`
	ClosedAt          string  `json:"closed_at"`
}

func (s *ClosureService) CloseMonth(year, month string) (*ClosureResult, error) {
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

	cl := &core.Closure{
		Type:          core.MonthlyClosure,
		Period:        fmt.Sprintf("%s-%s", year, month),
		TotalIncome:   incomeUsd,
		TotalExpenses: expensesUsd,
		Balance:       incomeUsd - expensesUsd,
	}
	_, err = s.closureRepo.Create(cl)
	if err != nil {
		return nil, fmt.Errorf("save closure: %w", err)
	}

	return &ClosureResult{
		Month:            cl.Period,
		TotalIncomeBs:     incomeBs,
		TotalExpensesBs:   expensesBs,
		BalanceBs:         incomeBs - expensesBs,
		TotalIncomeUsd:    incomeUsd,
		TotalExpensesUsd:  expensesUsd,
		BalanceUsd:        incomeUsd - expensesUsd,
		TotalIncomeUsdt:   incomeUsdt,
		TotalExpensesUsdt: expensesUsdt,
		BalanceUsdt:       incomeUsdt - expensesUsdt,
		ClosedAt:          cl.ClosedAt,
	}, nil
}

func (s *ClosureService) CloseDay(date string) (*ClosureResult, error) {
	incomeBs, expensesBs, incomeUsd, expensesUsd, incomeUsdt, expensesUsdt, err := s.txRepo.GetTotals(date, date)
	if err != nil {
		return nil, fmt.Errorf("get totals: %w", err)
	}

	cl := &core.Closure{
		Type:          core.DailyClosure,
		Period:        date,
		TotalIncome:   incomeUsd,
		TotalExpenses: expensesUsd,
		Balance:       incomeUsd - expensesUsd,
	}
	_, err = s.closureRepo.Create(cl)
	if err != nil {
		return nil, fmt.Errorf("save daily closure: %w", err)
	}

	return &ClosureResult{
		Month:            date,
		TotalIncomeBs:     incomeBs,
		TotalExpensesBs:   expensesBs,
		BalanceBs:         incomeBs - expensesBs,
		TotalIncomeUsd:    incomeUsd,
		TotalExpensesUsd:  expensesUsd,
		BalanceUsd:        incomeUsd - expensesUsd,
		TotalIncomeUsdt:   incomeUsdt,
		TotalExpensesUsdt: expensesUsdt,
		BalanceUsdt:       incomeUsdt - expensesUsdt,
		ClosedAt:          cl.ClosedAt,
	}, nil
}

func (s *ClosureService) IsDayClosed(date string) (bool, error) {
	_, err := s.closureRepo.GetByPeriod(date, core.DailyClosure)
	if err != nil {
		return false, nil
	}
	return true, nil
}

func (s *ClosureService) IsMonthClosed(year, month string) (bool, error) {
	period := fmt.Sprintf("%s-%s", year, month)
	_, err := s.closureRepo.GetByPeriod(period, core.MonthlyClosure)
	if err != nil {
		return false, nil // not closed
	}
	return true, nil
}

func (s *ClosureService) ListClosures(limit int) ([]core.Closure, error) {
	return s.closureRepo.List(limit)
}
