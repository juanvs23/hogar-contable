package core

type TransactionType string

const (
	Income  TransactionType = "income"
	Expense TransactionType = "expense"
)

type Transaction struct {
	ID           int64           `json:"id"`
	Type         TransactionType `json:"type"`
	Description  string          `json:"description"`
	AmountBs     float64         `json:"amount_bs"`
	AmountUsdBcv float64         `json:"amount_usd_bcv"`
	AmountUsdt   float64         `json:"amount_usdt"`
	RateOfficial float64         `json:"rate_official"`
	RateP2P      float64         `json:"rate_p2p"`
	CategoryID   *int64          `json:"category_id,omitempty"`
	Date         string          `json:"date"` // YYYY-MM-DD
	CreatedAt    string          `json:"created_at"`
}

type CategoryTotal struct {
	CategoryID   int64   `json:"category_id"`
	CategoryName string  `json:"category_name"`
	TotalBs      float64 `json:"total_bs"`
	TotalUsd     float64 `json:"total_usd"`
	TotalUsdt    float64 `json:"total_usdt"`
}

type Category struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	Type      TransactionType `json:"type"` // income or expense
	IsDefault bool   `json:"is_default"`
}
