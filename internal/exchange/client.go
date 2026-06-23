package exchange

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// dolarRateResponse represents the response from dolarapi.com.
type dolarRateResponse struct {
	Moneda  string  `json:"moneda"`
	Fuente  string  `json:"fuente"`
	Nombre  string  `json:"nombre"`
	Compra  *float64 `json:"compra"`
	Venta   *float64 `json:"venta"`
	Promedio float64 `json:"promedio"`
}

// Client fetches exchange rates from external API.
type Client struct {
	httpClient *http.Client
	officialURL string
	p2pURL     string
}

func NewClient(apiURL string) *Client {
	_ = apiURL // unused, we use fixed URLs
	return &Client{
		httpClient:  &http.Client{Timeout: 10 * time.Second},
		officialURL: "https://ve.dolarapi.com/v1/dolares/oficial",
		p2pURL:      "https://ve.dolarapi.com/v1/dolares/paralelo",
	}
}

// FetchRates gets the current official and P2P exchange rates.
// Returns (official, p2p, error).
func (c *Client) FetchRates() (official, p2p float64, err error) {
	official, err = c.fetchRate(c.officialURL)
	if err != nil {
		return 0, 0, fmt.Errorf("fetch official: %w", err)
	}

	p2p, err = c.fetchRate(c.p2pURL)
	if err != nil {
		return 0, 0, fmt.Errorf("fetch p2p: %w", err)
	}

	return official, p2p, nil
}

func (c *Client) fetchRate(url string) (float64, error) {
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return 0, fmt.Errorf("get %s: %w", url, err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}

	var rate dolarRateResponse
	if err := json.Unmarshal(body, &rate); err != nil {
		return 0, fmt.Errorf("parse response: %w", err)
	}

	if rate.Promedio <= 0 {
		return 0, fmt.Errorf("invalid rate value: %f", rate.Promedio)
	}

	return rate.Promedio, nil
}
