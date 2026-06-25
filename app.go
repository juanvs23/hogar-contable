package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"hogar-contable/internal/core"
	"hogar-contable/internal/database"
	"hogar-contable/internal/exchange"
	"hogar-contable/internal/repository"
	"hogar-contable/internal/service"
)

// App struct — entry point for all Wails commands
type App struct {
	ctx              context.Context
	db               *database.DB
	transactionSvc   *service.TransactionService
	exchangeSvc      *service.ExchangeService
	closureSvc       *service.ClosureService
	savingSvc        *service.SavingService
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup initializes the database and services
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Determine database path
	dbDir := filepath.Join(getDataDir(), "hogar-contable")
	dbPath := filepath.Join(dbDir, "hogar-contable.db")

	log.Printf("Initializing database at: %s", dbPath)

	db, err := database.Open(dbPath)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	a.db = db

	// Initialize repositories
	txRepo := repository.NewTransactionRepo(db.DB)
	catRepo := repository.NewCategoryRepo(db.DB)
	rateRepo := repository.NewExchangeRateRepo(db.DB)
	closureRepo := repository.NewClosureRepo(db.DB)
	savingRepo := repository.NewSavingRepo(db.DB)

	// Initialize services
	a.transactionSvc = service.NewTransactionService(txRepo, catRepo)
	a.exchangeSvc = service.NewExchangeService(rateRepo, exchange.NewClient(""))
	a.closureSvc = service.NewClosureService(txRepo, closureRepo)
	a.savingSvc = service.NewSavingService(savingRepo)

	log.Println("hogar-contable started successfully")
}

// getDataDir returns the platform-specific data directory
func getDataDir() string {
	// On Windows, use %APPDATA%
	// On Linux, use ~/.local/share
	if dir := os.Getenv("APPDATA"); dir != "" {
		return dir
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "."
	}
	return filepath.Join(home, ".local", "share")
}

// ============================================================
// Wails Command Handlers
// ============================================================

// Greet is the default Wails greeting
func (a *App) Greet(name string) string {
	return fmt.Sprintf("¡Hola %s! Bienvenido a Hogar Contable", name)
}

// --- Transactions ---

func (a *App) CreateTransaction(txType, description string, amountBs, amountUsdBcv, amountUsdt, rateOfficial, rateP2p float64, categoryID *int64, date string) (int64, error) {
	tx := &core.Transaction{
		Type:         core.TransactionType(txType),
		Description:  description,
		AmountBs:     amountBs,
		AmountUsdBcv: amountUsdBcv,
		AmountUsdt:   amountUsdt,
		RateOfficial: rateOfficial,
		RateP2P:      rateP2p,
		CategoryID:   categoryID,
		Date:         date,
	}
	return a.transactionSvc.Create(tx)
}

func (a *App) GetTransaction(id int64) (*core.Transaction, error) {
	return a.transactionSvc.GetByID(id)
}

func (a *App) ListTransactions(dateFrom, dateTo, txType string) ([]core.Transaction, error) {
	return a.transactionSvc.List(dateFrom, dateTo, txType)
}

func (a *App) UpdateTransaction(id int64, txType, description string, amountBs, amountUsdBcv, amountUsdt, rateOfficial, rateP2p float64, categoryID *int64, date string) error {
	tx := &core.Transaction{
		ID:           id,
		Type:         core.TransactionType(txType),
		Description:  description,
		AmountBs:     amountBs,
		AmountUsdBcv: amountUsdBcv,
		AmountUsdt:   amountUsdt,
		RateOfficial: rateOfficial,
		RateP2P:      rateP2p,
		CategoryID:   categoryID,
		Date:         date,
	}
	return a.transactionSvc.Update(tx)
}

func (a *App) DeleteTransaction(id int64) error {
	return a.transactionSvc.Delete(id)
}

func (a *App) GetMonthlySummary(year, month string) (*service.MonthlySummary, error) {
	return a.transactionSvc.GetMonthlySummary(year, month)
}

func (a *App) GetYearlySummary(year string) (*service.MonthlySummary, error) {
	return a.transactionSvc.GetYearlySummary(year)
}

func (a *App) GetExpensesByCategory(year, month string) ([]core.CategoryTotal, error) {
	return a.transactionSvc.GetExpensesByCategory(year, month)
}

func (a *App) GetIncomeByCategory(year, month string) ([]core.CategoryTotal, error) {
	return a.transactionSvc.GetIncomeByCategory(year, month)
}

// --- Categories ---

func (a *App) ListCategories(txType string) ([]core.Category, error) {
	return a.transactionSvc.GetCategories(txType)
}

func (a *App) CreateCategory(name, txType string) (int64, error) {
	cat := &core.Category{Name: name, Type: core.TransactionType(txType)}
	return a.transactionSvc.CreateCategory(cat)
}

func (a *App) UpdateCategory(id int64, name, txType string) error {
	cat := &core.Category{ID: id, Name: name, Type: core.TransactionType(txType)}
	return a.transactionSvc.UpdateCategory(cat)
}

func (a *App) DeleteCategory(id int64) error {
	return a.transactionSvc.DeleteCategory(id)
}

// --- Closures ---

func (a *App) CloseMonth(year, month string) (*service.ClosureResult, error) {
	return a.closureSvc.CloseMonth(year, month)
}

func (a *App) IsMonthClosed(year, month string) (bool, error) {
	return a.closureSvc.IsMonthClosed(year, month)
}

// --- Savings ---

func (a *App) CreateSaving(description string, amountBs, amountUsd float64) (int64, error) {
	return a.savingSvc.Create(&core.Saving{Description: description, AmountBs: amountBs, AmountUsd: amountUsd})
}

func (a *App) ListSavings() ([]core.Saving, error) {
	return a.savingSvc.List()
}

func (a *App) UpdateSaving(id int64, description string, amountBs, amountUsd float64) error {
	return a.savingSvc.Update(&core.Saving{ID: id, Description: description, AmountBs: amountBs, AmountUsd: amountUsd})
}

func (a *App) DeleteSaving(id int64) error {
	return a.savingSvc.Delete(id)
}

func (a *App) GetSavingTotal() (*service.SavingTotal, error) {
	return a.savingSvc.GetTotal()
}

// --- Exchange Rates ---

type ExchangeRateResult struct {
	Official float64 `json:"official"`
	P2P      float64 `json:"p2p"`
}

func (a *App) GetCurrentExchangeRates() (*ExchangeRateResult, error) {
	official, p2p, err := a.exchangeSvc.GetCurrentRates()
	if err != nil {
		return nil, err
	}
	return &ExchangeRateResult{Official: official, P2P: p2p}, nil
}

func (a *App) GetLastExchangeRates() (*ExchangeRateResult, error) {
	official, p2p, err := a.exchangeSvc.GetLatestFromDB()
	if err != nil {
		return nil, err
	}
	return &ExchangeRateResult{Official: official, P2P: p2p}, nil
}

func (a *App) ConvertBsToUsd(amountBs, rate float64) float64 {
	return service.ConvertBsToUsd(amountBs, rate)
}

func (a *App) ConvertUsdToBs(amountUsd, rate float64) float64 {
	return service.ConvertUsdToBs(amountUsd, rate)
}
