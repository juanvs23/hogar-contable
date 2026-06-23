package core

type RateType string

const (
	Official RateType = "official"
	P2P      RateType = "p2p"
)

type ExchangeRate struct {
	ID        int64     `json:"id"`
	Type      RateType  `json:"type"`
	Value     float64   `json:"value"`
	Source    string    `json:"source"`
	CreatedAt string `json:"created_at"`
}
