package core

type SavingAccount struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	CreatedAt   string `json:"created_at"`
}

type SavingMovement struct {
	ID                   int64   `json:"id"`
	AccountID            int64   `json:"account_id"`
	Type                 string  `json:"type"` // "deposit" or "withdraw"
	AmountUsd            float64 `json:"amount_usd"`  // USD BCV
	AmountUsdt           float64 `json:"amount_usdt"` // USDT
	AmountBs             float64 `json:"amount_bs"`
	Description          string  `json:"description"`
	Date                 string  `json:"date"` // YYYY-MM-DD
	CreatedTransactionID *int64  `json:"created_transaction_id,omitempty"`
	CreatedAt            string  `json:"created_at"`
}

type AccountBalance struct {
	Account    SavingAccount `json:"account"`
	BalanceUsd float64      `json:"balance_usd"`  // USD BCV
	BalanceUsdt float64     `json:"balance_usdt"` // USDT
	BalanceBs  float64      `json:"balance_bs"`
}
