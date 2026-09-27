package service

import (
	"strings"
	"testing"

	"hogar-contable/internal/core"
)

// mockSavingAccRepo implements repository.SavingAccountRepository for testing.
type mockSavingAccRepo struct {
	balanceUsd  float64
	balanceUsdt float64
	balanceBs   float64
}

func (m *mockSavingAccRepo) Create(acc *core.SavingAccount) (int64, error) { return 1, nil }
func (m *mockSavingAccRepo) List() ([]core.SavingAccount, error)           { return []core.SavingAccount{}, nil }
func (m *mockSavingAccRepo) Update(acc *core.SavingAccount) error           { return nil }
func (m *mockSavingAccRepo) Delete(id int64) error                         { return nil }
func (m *mockSavingAccRepo) GetBalance(accountID int64) (usd, usdt, bs float64, err error) {
	return m.balanceUsd, m.balanceUsdt, m.balanceBs, nil
}
func (m *mockSavingAccRepo) GetAllBalances() ([]core.AccountBalance, error) {
	return []core.AccountBalance{}, nil
}

// mockSavingMovRepo implements repository.SavingMovementRepository for testing.
type mockSavingMovRepo struct {
	created *core.SavingMovement
}

func (m *mockSavingMovRepo) Create(mov *core.SavingMovement) (int64, error) {
	m.created = mov
	return 1, nil
}

func (m *mockSavingMovRepo) Update(mov *core.SavingMovement) error { return nil }
func (m *mockSavingMovRepo) ListByAccount(accountID int64) ([]core.SavingMovement, error) {
	return []core.SavingMovement{}, nil
}
func (m *mockSavingMovRepo) Delete(id int64) error { return nil }

func newSavingServiceForTest(acc *mockSavingAccRepo, mov *mockSavingMovRepo) *SavingService {
	return NewSavingService(acc, mov, NewTransactionService(&mockTxRepo{}, &mockCatRepo{}))
}

// Regression: withdraw must validate against the USDT balance (the savings
// base currency), not the derived USD BCV balance. Each movement stores the
// USD figure computed with the rates of its own moment, so a USD check with
// today's rates rejects withdrawals that are fully covered in USDT.
func TestWithdraw_MixedRates_SufficientUsdt_Allows(t *testing.T) {
	acc := &mockSavingAccRepo{
		balanceUsd:  150, // stored when the paralelo/oficial ratio was 1.5
		balanceUsdt: 100,
		balanceBs:   20000,
	}
	mov := &mockSavingMovRepo{}
	svc := newSavingServiceForTest(acc, mov)

	// Withdrawing the full balance at a new ratio (2.0) inflates today's USD
	// figure: amountUsd(200) > balanceUsd(150). The old USD check rejected this.
	id, err := svc.Withdraw(WithdrawInput{
		AccountID:  1,
		AmountUsd:  200,
		AmountUsdt: 100,
		AmountBs:   25000,
	})
	if err != nil {
		t.Fatalf("expected full-balance USDT withdrawal to succeed, got %v", err)
	}
	if id != 1 {
		t.Errorf("expected movement id 1, got %d", id)
	}
	if mov.created == nil {
		t.Fatal("expected movement persisted")
	}
	if mov.created.AmountUsdt != 100 {
		t.Errorf("expected persisted amount_usdt 100, got %.2f", mov.created.AmountUsdt)
	}
	if mov.created.Type != "withdraw" {
		t.Errorf("expected type withdraw, got %q", mov.created.Type)
	}
}

// Regression, overdraft direction: a USD check lets the user withdraw more
// USDT than held whenever the stored USD figures are inflated relative to
// today's rates.
func TestWithdraw_InsufficientUsdt_Rejects(t *testing.T) {
	acc := &mockSavingAccRepo{balanceUsd: 300, balanceUsdt: 50}
	mov := &mockSavingMovRepo{}
	svc := newSavingServiceForTest(acc, mov)

	_, err := svc.Withdraw(WithdrawInput{
		AccountID:  1,
		AmountUsd:  100, // USD figures suggest the balance covers it...
		AmountUsdt: 80,  // ...but the USDT balance does not
	})
	if err == nil {
		t.Fatal("expected insufficient balance error, got nil")
	}
	if !strings.Contains(err.Error(), "saldo insuficiente") {
		t.Errorf("expected 'saldo insuficiente' error, got %q", err.Error())
	}
	if !strings.Contains(err.Error(), "USDT") {
		t.Errorf("expected error to report the balance in USDT, got %q", err.Error())
	}
	if mov.created != nil {
		t.Error("expected no movement persisted on rejection")
	}
}

func TestWithdraw_ExactUsdtBalance_Allows(t *testing.T) {
	acc := &mockSavingAccRepo{balanceUsdt: 100}
	mov := &mockSavingMovRepo{}
	svc := newSavingServiceForTest(acc, mov)

	if _, err := svc.Withdraw(WithdrawInput{AccountID: 1, AmountUsdt: 100}); err != nil {
		t.Errorf("expected exact-balance withdrawal to succeed, got %v", err)
	}
	if mov.created == nil {
		t.Error("expected movement persisted")
	}
}
