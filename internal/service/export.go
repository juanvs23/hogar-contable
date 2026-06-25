package service

import (
	"encoding/csv"
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"

	"hogar-contable/internal/core"
	"hogar-contable/internal/repository"

	"github.com/xuri/excelize/v2"
)

type ExportService struct {
	txRepo repository.TransactionRepository
}

func NewExportService(txRepo repository.TransactionRepository) *ExportService {
	return &ExportService{txRepo: txRepo}
}

func (s *ExportService) ExportTransactions(filePath, dateFrom, dateTo, txType string) error {
	transactions, err := s.txRepo.List(dateFrom, dateTo, txType)
	if err != nil {
		return fmt.Errorf("list transactions: %w", err)
	}
	return writeTransactionsExcel(filePath, transactions)
}

func (s *ExportService) ExportSavings(filePath string, savings []core.Saving) error {
	f := excelize.NewFile()
	defer f.Close()

	sheet := "Ahorros"
	f.SetSheetName("Sheet1", sheet)

	headers := []any{"Fecha", "Descripción", "Monto USD", "Monto Bs"}
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 11},
		Fill: excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"#E3F2FD"}},
	})
	for i, h := range headers {
		col := string(rune('A' + i))
		f.SetCellValue(sheet, fmt.Sprintf("%s1", col), h)
	}
	lastCol := string(rune('A' + len(headers) - 1))
	f.SetCellStyle(sheet, "A1", fmt.Sprintf("%s1", lastCol), headerStyle)

	for i, sv := range savings {
		row := i + 2
		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), sv.CreatedAt)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), sv.Description)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), sv.AmountUsd)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), sv.AmountBs)
	}

	for col, w := range map[string]float64{"A": 18, "B": 30, "C": 14, "D": 14} {
		f.SetColWidth(sheet, col, col, w)
	}

	numFmt := "#,##0.00"
	moneyStyle, _ := f.NewStyle(&excelize.Style{CustomNumFmt: &numFmt})
	if len(savings) > 0 {
		f.SetCellStyle(sheet, "C2", fmt.Sprintf("D%d", len(savings)+1), moneyStyle)
	}

	rangeExpr := fmt.Sprintf("A1:%s%d", lastCol, len(savings)+1)
	f.AutoFilter(sheet, rangeExpr, []excelize.AutoFilterOptions{})

	return f.SaveAs(filePath)
}

func (s *ExportService) ExportMonthlyReport(filePath, year, month string, summary *MonthlySummary, expenseCats, incomeCats []core.CategoryTotal) error {
	f := excelize.NewFile()
	defer f.Close()

	sheet := "Reporte"
	f.SetSheetName("Sheet1", sheet)

	// Title
	title := fmt.Sprintf("Reporte Mensual - %s/%s", month, year)
	f.SetCellValue(sheet, "A1", title)
	titleStyle, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true, Size: 14}})
	f.SetCellStyle(sheet, "A1", "A1", titleStyle)

	// Summary
	f.SetCellValue(sheet, "A3", "Resumen")
	summaryHeaders := []any{"Concepto", "USD", "Bs"}
	shs, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 11},
		Fill: excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"#F5F5F5"}},
	})
	f.SetCellStyle(sheet, "A4", "C4", shs)
	// rewrite header properly on row 4
	for i, h := range summaryHeaders {
		col := string(rune('A' + i))
		f.SetCellValue(sheet, fmt.Sprintf("%s4", col), h)
	}
	f.SetCellStyle(sheet, "A4", "C4", shs)

	f.SetCellValue(sheet, "A5", "Ingresos")
	f.SetCellValue(sheet, "B5", summary.TotalIncomeUsd)
	f.SetCellValue(sheet, "C5", summary.TotalIncomeBs)
	f.SetCellValue(sheet, "A6", "Gastos")
	f.SetCellValue(sheet, "B6", summary.TotalExpensesUsd)
	f.SetCellValue(sheet, "C6", summary.TotalExpensesBs)
	f.SetCellValue(sheet, "A7", "Balance")
	f.SetCellValue(sheet, "B7", summary.BalanceUsd)
	f.SetCellValue(sheet, "C7", summary.BalanceBs)

	// Expense categories
	row := 9
	f.SetCellValue(sheet, fmt.Sprintf("A%d", row), "Gastos por categoría")
	row++
	catHeaders := []any{"Categoría", "USD", "Bs"}
	for i, h := range catHeaders {
		col := string(rune('A' + i))
		f.SetCellValue(sheet, fmt.Sprintf("%s%d", col, row), h)
	}
	expHS, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 11},
		Fill: excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"#FFEBEE"}},
	})
	f.SetCellStyle(sheet, fmt.Sprintf("A%d", row), fmt.Sprintf("C%d", row), expHS)
	row++

	for _, cat := range expenseCats {
		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), cat.CategoryName)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), cat.TotalUsd)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), cat.TotalBs)
		row++
	}

	// Income categories
	row++
	f.SetCellValue(sheet, fmt.Sprintf("A%d", row), "Ingresos por categoría")
	row++
	for i, h := range catHeaders {
		col := string(rune('A' + i))
		f.SetCellValue(sheet, fmt.Sprintf("%s%d", col, row), h)
	}
	incHS, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 11},
		Fill: excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"#E8F5E9"}},
	})
	f.SetCellStyle(sheet, fmt.Sprintf("A%d", row), fmt.Sprintf("C%d", row), incHS)
	row++

	for _, cat := range incomeCats {
		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), cat.CategoryName)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), cat.TotalUsd)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), cat.TotalBs)
		row++
	}

	// Column widths
	for col, w := range map[string]float64{"A": 30, "B": 14, "C": 14} {
		f.SetColWidth(sheet, col, col, w)
	}

	return f.SaveAs(filePath)
}

func writeTransactionsExcel(filePath string, transactions []core.Transaction) error {
	f := excelize.NewFile()
	defer f.Close()

	sheet := "Transacciones"
	f.SetSheetName("Sheet1", sheet)

	headers := []any{"Fecha", "Tipo", "Descripción", "Monto Bs", "Monto USD BCV", "Monto USDT", "Tasa Oficial", "Tasa P2P"}
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 11},
		Fill: excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"#E8F5E9"}},
	})
	for i, h := range headers {
		col := string(rune('A' + i))
		f.SetCellValue(sheet, fmt.Sprintf("%s1", col), h)
	}
	lastCol := string(rune('A' + len(headers) - 1))
	f.SetCellStyle(sheet, "A1", fmt.Sprintf("%s1", lastCol), headerStyle)

	for i, tx := range transactions {
		row := i + 2
		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), tx.Date)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), mapTypeExcel(tx.Type))
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), tx.Description)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), tx.AmountBs)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row), tx.AmountUsdBcv)
		f.SetCellValue(sheet, fmt.Sprintf("F%d", row), tx.AmountUsdt)
		f.SetCellValue(sheet, fmt.Sprintf("G%d", row), tx.RateOfficial)
		f.SetCellValue(sheet, fmt.Sprintf("H%d", row), tx.RateP2P)
	}

	for col, w := range map[string]float64{"A": 12, "B": 8, "C": 30, "D": 14, "E": 14, "F": 14, "G": 12, "H": 12} {
		f.SetColWidth(sheet, col, col, w)
	}

	numFmt := "#,##0.00"
	moneyStyle, _ := f.NewStyle(&excelize.Style{CustomNumFmt: &numFmt})
	lastRow := len(transactions) + 1
	if lastRow >= 2 {
		f.SetCellStyle(sheet, "D2", fmt.Sprintf("H%d", lastRow), moneyStyle)
	}

	rangeExpr := fmt.Sprintf("A1:%s%d", lastCol, lastRow)
	f.AutoFilter(sheet, rangeExpr, []excelize.AutoFilterOptions{})

	return f.SaveAs(filePath)
}

// ImportResult contains the result of a CSV import.
type ImportResult struct {
	Imported int    `json:"imported"`
	Errors   string `json:"errors,omitempty"`
}

// ImportTransactionsFromCSV reads a CSV file and creates transactions.
// Expected CSV format: date,type,description,amount_bs,amount_usd_bcv,amount_usdt
// type: "income" or "expense"
func (s *ExportService) ImportTransactionsFromCSV(filePath string) (*ImportResult, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("open file: %w", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.TrimLeadingSpace = true

	var errorLines []string
	imported := 0
	lineNum := 0

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("read csv: %w", err)
		}
		lineNum++

		// Skip header row
		if lineNum == 1 && strings.HasPrefix(strings.ToLower(record[0]), "date") {
			continue
		}

		if len(record) < 4 {
			errorLines = append(errorLines, fmt.Sprintf("Línea %d: columnas insuficientes", lineNum))
			continue
		}

		date := strings.TrimSpace(record[0])
		txType := strings.TrimSpace(record[1])
		description := strings.TrimSpace(record[2])

		amountBs, _ := strconv.ParseFloat(strings.TrimSpace(record[3]), 64)
		amountUsdBcv := 0.0
		amountUsdt := 0.0

		if len(record) > 4 {
			amountUsdBcv, _ = strconv.ParseFloat(strings.TrimSpace(record[4]), 64)
		}
		if len(record) > 5 {
			amountUsdt, _ = strconv.ParseFloat(strings.TrimSpace(record[5]), 64)
		}

		if description == "" || (amountBs <= 0 && amountUsdBcv <= 0 && amountUsdt <= 0) {
			errorLines = append(errorLines, fmt.Sprintf("Línea %d: datos inválidos", lineNum))
			continue
		}

		tx := &core.Transaction{
			Type:         core.TransactionType(txType),
			Description:  description,
			AmountBs:     amountBs,
			AmountUsdBcv: amountUsdBcv,
			AmountUsdt:   amountUsdt,
			Date:         date,
		}

		if _, err := s.txRepo.Create(tx); err != nil {
			errorLines = append(errorLines, fmt.Sprintf("Línea %d: %v", lineNum, err))
			continue
		}
		imported++
	}

	result := &ImportResult{Imported: imported}
	if len(errorLines) > 0 {
		result.Errors = strings.Join(errorLines, "\n")
	}
	return result, nil
}

func mapTypeExcel(t core.TransactionType) string {
	if t == core.Income {
		return "Ingreso"
	}
	return "Gasto"
}
