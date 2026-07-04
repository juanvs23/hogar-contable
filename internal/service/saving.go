package service

import (
	"fmt"

	"hogar-contable/internal/core"
	"hogar-contable/internal/repository"
)

type SavingService struct {
	accRepo   repository.SavingAccountRepository
	movRepo   repository.SavingMovementRepository
	txService *TransactionService // to create transactions on withdraw
}

func NewSavingService(accRepo repository.SavingAccountRepository, movRepo repository.SavingMovementRepository, txService *TransactionService) *SavingService {
	return &SavingService{accRepo: accRepo, movRepo: movRepo, txService: txService}
}

// --- Accounts ---

func (s *SavingService) CreateAccount(name, description string) (int64, error) {
	return s.accRepo.Create(&core.SavingAccount{Name: name, Description: description})
}

func (s *SavingService) ListAccounts() ([]core.AccountBalance, error) {
	return s.accRepo.GetAllBalances()
}

func (s *SavingService) UpdateAccount(id int64, name, description string) error {
	return s.accRepo.Update(&core.SavingAccount{ID: id, Name: name, Description: description})
}

func (s *SavingService) DeleteAccount(id int64) error {
	return s.accRepo.Delete(id)
}

// --- Movements ---

type DepositInput struct {
	AccountID   int64   `json:"account_id"`
	AmountUsd   float64 `json:"amount_usd"`
	AmountBs    float64 `json:"amount_bs"`
	Description string  `json:"description"`
}

func (s *SavingService) Deposit(in DepositInput) (int64, error) {
	mov := &core.SavingMovement{
		AccountID:   in.AccountID,
		Type:        "deposit",
		AmountUsd:   in.AmountUsd,
		AmountBs:    in.AmountBs,
		Description: in.Description,
	}
	return s.movRepo.Create(mov)
}

type WithdrawInput struct {
	AccountID      int64   `json:"account_id"`
	AmountUsd      float64 `json:"amount_usd"`
	AmountBs       float64 `json:"amount_bs"`
	Description    string  `json:"description"`
	CreateIncome   bool    `json:"create_income"`   // if true, creates a transaction
	IncomeCategory *int64  `json:"income_category"` // category for the income tx
}

func (s *SavingService) Withdraw(in WithdrawInput) (int64, error) {
	// Check balance
	usd, _, err := s.accRepo.GetBalance(in.AccountID)
	if err != nil {
		return 0, fmt.Errorf("check balance: %w", err)
	}
	if usd < in.AmountUsd {
		return 0, fmt.Errorf("saldo insuficiente: disponible $%.2f, solicitado $%.2f", usd, in.AmountUsd)
	}

	mov := &core.SavingMovement{
		AccountID:   in.AccountID,
		Type:        "withdraw",
		AmountUsd:   in.AmountUsd,
		AmountBs:    in.AmountBs,
		Description: in.Description,
	}

	// If user wants to create income transaction
	if in.CreateIncome {
		tx := &core.Transaction{
			Type:        core.Income,
			Description: fmt.Sprintf("Retiro de ahorro: %s", in.Description),
			AmountBs:    in.AmountBs,
			AmountUsdBcv: in.AmountUsd,
			Date:        "", // service will set today
			CategoryID:  in.IncomeCategory,
		}
		txID, err := s.txService.Create(tx)
		if err != nil {
			return 0, fmt.Errorf("create income transaction: %w", err)
		}
		mov.CreatedTransactionID = &txID
	}

	return s.movRepo.Create(mov)
}

func (s *SavingService) ListMovements(accountID int64) ([]core.SavingMovement, error) {
	return s.movRepo.ListByAccount(accountID)
}

func (s *SavingService) UpdateMovement(id int64, amountUsd, amountBs float64, description string) error {
	return s.movRepo.Update(&core.SavingMovement{ID: id, AmountUsd: amountUsd, AmountBs: amountBs, Description: description})
}

func (s *SavingService) DeleteMovement(id int64) error {
	return s.movRepo.Delete(id)
}

func (s *SavingService) GetAccountBalance(accountID int64) (usd, bs float64, err error) {
	return s.accRepo.GetBalance(accountID)
}
