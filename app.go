package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"hogar-contable/internal/core"
	"hogar-contable/internal/database"
	"hogar-contable/internal/exchange"
	"hogar-contable/internal/repository"
	"hogar-contable/internal/service"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct — entry point for all Wails commands
type App struct {
	ctx              context.Context
	db               *database.DB
	transactionSvc   *service.TransactionService
	exchangeSvc      *service.ExchangeService
	closureSvc       *service.ClosureService
	savingSvc        *service.SavingService
	exportSvc        *service.ExportService
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
	accRepo := repository.NewSavingAccountRepo(db.DB)
	movRepo := repository.NewSavingMovementRepo(db.DB)

	// Initialize services
	a.transactionSvc = service.NewTransactionService(txRepo, catRepo)
	a.exchangeSvc = service.NewExchangeService(rateRepo, exchange.NewClient(""))
	a.closureSvc = service.NewClosureService(txRepo, closureRepo)
	a.savingSvc = service.NewSavingService(accRepo, movRepo, a.transactionSvc)
	a.exportSvc = service.NewExportService(txRepo)

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

func (a *App) CloseDay(date string) (*service.ClosureResult, error) {
	return a.closureSvc.CloseDay(date)
}

func (a *App) IsDayClosed(date string) (bool, error) {
	return a.closureSvc.IsDayClosed(date)
}

// --- Savings ---

// Accounts
func (a *App) CreateSavingAccount(name, description string) (int64, error) {
	return a.savingSvc.CreateAccount(name, description)
}

func (a *App) ListSavingAccounts() ([]core.AccountBalance, error) {
	return a.savingSvc.ListAccounts()
}

func (a *App) UpdateSavingAccount(id int64, name, description string) error {
	return a.savingSvc.UpdateAccount(id, name, description)
}

func (a *App) DeleteSavingAccount(id int64) error {
	return a.savingSvc.DeleteAccount(id)
}

// Movements
func (a *App) DepositToAccount(accountID int64, amountUsd, amountUsdt, amountBs float64, description string) (int64, error) {
	return a.savingSvc.Deposit(service.DepositInput{
		AccountID: accountID, AmountUsd: amountUsd, AmountUsdt: amountUsdt, AmountBs: amountBs, Description: description,
	})
}

func (a *App) WithdrawFromAccount(accountID int64, amountUsd, amountUsdt, amountBs float64, description string, createIncome bool, incomeCategory *int64) (int64, error) {
	return a.savingSvc.Withdraw(service.WithdrawInput{
		AccountID: accountID, AmountUsd: amountUsd, AmountUsdt: amountUsdt, AmountBs: amountBs,
		Description: description, CreateIncome: createIncome, IncomeCategory: incomeCategory,
	})
}

func (a *App) ListAccountMovements(accountID int64) ([]core.SavingMovement, error) {
	return a.savingSvc.ListMovements(accountID)
}

func (a *App) UpdateSavingMovement(id int64, amountUsd, amountUsdt, amountBs float64, description string) error {
	return a.savingSvc.UpdateMovement(id, amountUsd, amountUsdt, amountBs, description)
}

func (a *App) DeleteSavingMovement(id int64) error {
	return a.savingSvc.DeleteMovement(id)
}

// --- Export ---

func (a *App) ExportTransactionsToExcel(dateFrom, dateTo, txType string) (string, error) {
	dir := filepath.Join(getDataDir(), "hogar-contable", "exports")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("create export dir: %w", err)
	}

	fileName := fmt.Sprintf("transacciones_%s.xlsx", time.Now().Format("2006-01-02_150405"))
	filePath := filepath.Join(dir, fileName)

	if err := a.exportSvc.ExportTransactions(filePath, dateFrom, dateTo, txType); err != nil {
		return "", err
	}

	// Open native save dialog
	savePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultFilename:  fileName,
		Title:            "Guardar exportación",
		Filters:          []runtime.FileFilter{{DisplayName: "Excel (.xlsx)", Pattern: "*.xlsx"}},
	})
	if err != nil {
		return "", fmt.Errorf("save dialog: %w", err)
	}

	if savePath == "" {
		return "", nil // user cancelled
	}

	// Copy from temp to chosen location
	input, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("read temp file: %w", err)
	}
	if err := os.WriteFile(savePath, input, 0644); err != nil {
		return "", fmt.Errorf("write file: %w", err)
	}

	return savePath, nil
}

func (a *App) ExportReportToExcel(year, month string) (string, error) {
	summary, err := a.transactionSvc.GetMonthlySummary(year, month)
	if err != nil {
		return "", fmt.Errorf("get summary: %w", err)
	}

	expenseCats, err := a.transactionSvc.GetExpensesByCategory(year, month)
	if err != nil {
		return "", fmt.Errorf("get expense categories: %w", err)
	}

	incomeCats, err := a.transactionSvc.GetIncomeByCategory(year, month)
	if err != nil {
		return "", fmt.Errorf("get income categories: %w", err)
	}

	dir := filepath.Join(getDataDir(), "hogar-contable", "exports")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("create export dir: %w", err)
	}

	fileName := fmt.Sprintf("reporte_%s-%s.xlsx", year, month)
	filePath := filepath.Join(dir, fileName)

	if err := a.exportSvc.ExportMonthlyReport(filePath, year, month, summary, expenseCats, incomeCats); err != nil {
		return "", err
	}

	savePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultFilename: fileName,
		Title:           "Guardar reporte",
		Filters:         []runtime.FileFilter{{DisplayName: "Excel (.xlsx)", Pattern: "*.xlsx"}},
	})
	if err != nil {
		return "", fmt.Errorf("save dialog: %w", err)
	}
	if savePath == "" {
		return "", nil
	}

	input, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("read temp file: %w", err)
	}
	if err := os.WriteFile(savePath, input, 0644); err != nil {
		return "", fmt.Errorf("write file: %w", err)
	}

	return savePath, nil
}

func (a *App) ExportSavingsToExcel() (string, error) {
	balances, err := a.savingSvc.ListAccounts()
	if err != nil {
		return "", fmt.Errorf("list accounts: %w", err)
	}

	dir := filepath.Join(getDataDir(), "hogar-contable", "exports")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("create export dir: %w", err)
	}

	fileName := fmt.Sprintf("ahorros_%s.xlsx", time.Now().Format("2006-01-02"))
	filePath := filepath.Join(dir, fileName)

	if err := a.exportSvc.ExportSavings(filePath, balances); err != nil {
		return "", err
	}

	savePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultFilename: fileName,
		Title:           "Guardar ahorros",
		Filters:         []runtime.FileFilter{{DisplayName: "Excel (.xlsx)", Pattern: "*.xlsx"}},
	})
	if err != nil {
		return "", fmt.Errorf("save dialog: %w", err)
	}
	if savePath == "" {
		return "", nil
	}

	input, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("read temp file: %w", err)
	}
	if err := os.WriteFile(savePath, input, 0644); err != nil {
		return "", fmt.Errorf("write file: %w", err)
	}

	return savePath, nil
}

func (a *App) ImportTransactionsFromCSV() (*service.ImportResult, error) {
	filePath, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title:   "Importar transacciones",
		Filters: []runtime.FileFilter{{DisplayName: "CSV (.csv)", Pattern: "*.csv"}},
	})
	if err != nil {
		return nil, fmt.Errorf("open dialog: %w", err)
	}
	if filePath == "" {
		return &service.ImportResult{Imported: 0}, nil // user cancelled
	}

	return a.exportSvc.ImportTransactionsFromCSV(filePath)
}

// --- Backup ---

func (a *App) BackupDatabase() (string, error) {
	dbPath := a.db.Path
	if dbPath == "" {
		return "", fmt.Errorf("database path not set")
	}

	fileName := fmt.Sprintf("hogar-contable-backup_%s.db", time.Now().Format("2006-01-02_150405"))

	savePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultFilename: fileName,
		Title:           "Guardar backup de la base de datos",
		Filters:         []runtime.FileFilter{{DisplayName: "Base de datos SQLite (.db)", Pattern: "*.db"}},
	})
	if err != nil {
		return "", fmt.Errorf("save dialog: %w", err)
	}
	if savePath == "" {
		return "", nil // cancelled
	}

	input, err := os.ReadFile(dbPath)
	if err != nil {
		return "", fmt.Errorf("read database: %w", err)
	}
	if err := os.WriteFile(savePath, input, 0644); err != nil {
		return "", fmt.Errorf("write backup: %w", err)
	}

	return savePath, nil
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
