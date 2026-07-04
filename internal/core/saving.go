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
	AmountUsd            float64 `json:"amount_usd"`
	AmountBs             float64 `json:"amount_bs"`
	Description          string  `json:"description"`
	CreatedTransactionID *int64  `json:"created_transaction_id,omitempty"`
	CreatedAt            string  `json:"created_at"`
}

type AccountBalance struct {
	Account   SavingAccount `json:"account"`
	BalanceUsd float64      `json:"balance_usd"`
	BalanceBs  float64      `json:"balance_bs"`
}
