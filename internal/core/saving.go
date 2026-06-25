package core

type Saving struct {
	ID          int64   `json:"id"`
	Description string  `json:"description"`
	AmountBs    float64 `json:"amount_bs"`
	AmountUsd   float64 `json:"amount_usd"`
	CreatedAt   string  `json:"created_at"`
}
