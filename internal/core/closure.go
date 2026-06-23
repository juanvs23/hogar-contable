package core

type ClosureType string

const (
	DailyClosure   ClosureType = "daily"
	MonthlyClosure ClosureType = "monthly"
	YearlyClosure  ClosureType = "yearly"
)

type Closure struct {
	ID            int64       `json:"id"`
	Type          ClosureType `json:"type"`
	Period        string      `json:"period"` // "2026-06-23", "2026-06", "2026"
	TotalIncome   float64     `json:"total_income"`
	TotalExpenses float64     `json:"total_expenses"`
	Balance       float64     `json:"balance"`
	ClosedAt      string      `json:"closed_at"`
}
