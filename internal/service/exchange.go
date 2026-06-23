package service

import (
	"fmt"
	"log"

	"hogar-contable/internal/core"
	"hogar-contable/internal/exchange"
	"hogar-contable/internal/repository"
)

type ExchangeService struct {
	rateRepo   repository.ExchangeRateRepository
	apiClient  *exchange.Client
}

func NewExchangeService(rateRepo repository.ExchangeRateRepository, apiClient *exchange.Client) *ExchangeService {
	return &ExchangeService{rateRepo: rateRepo, apiClient: apiClient}
}

// GetCurrentRates returns the latest rates, fetching from API if available.
// Falls back to cached values if offline.
func (s *ExchangeService) GetCurrentRates() (official, p2p float64, err error) {
	official, p2p, apiErr := s.apiClient.FetchRates()
	if apiErr == nil {
		// Save fetched rates
		s.saveRate(core.Official, official)
		s.saveRate(core.P2P, p2p)
		return official, p2p, nil
	}

	// Fallback to cached values
	log.Printf("API unavailable, falling back to cache: %v", apiErr)

	cachedOfficial, err := s.rateRepo.GetLatest(core.Official)
	if err == nil {
		official = cachedOfficial.Value
	}
	cachedP2P, err := s.rateRepo.GetLatest(core.P2P)
	if err == nil {
		p2p = cachedP2P.Value
	}

	if official == 0 && p2p == 0 {
		return 0, 0, fmt.Errorf("exchange rates unavailable (offline and no cache)")
	}

	return official, p2p, nil
}

// GetLatestFromDB returns the last cached rates without fetching.
func (s *ExchangeService) GetLatestFromDB() (official, p2p float64, err error) {
	officialRate, err := s.rateRepo.GetLatest(core.Official)
	if err == nil {
		official = officialRate.Value
	}
	p2pRate, err := s.rateRepo.GetLatest(core.P2P)
	if err == nil {
		p2p = p2pRate.Value
	}
	return official, p2p, nil
}

func (s *ExchangeService) saveRate(rateType core.RateType, value float64) {
	rate := &core.ExchangeRate{
		Type:  rateType,
		Value: value,
	}
	if _, err := s.rateRepo.Save(rate); err != nil {
		log.Printf("failed to save exchange rate: %v", err)
	}
}

// ConvertBsToUsd converts bolivars to USD using the given rate.
func ConvertBsToUsd(amountBs, rate float64) float64 {
	if rate <= 0 {
		return 0
	}
	return amountBs / rate
}

// ConvertUsdToBs converts USD to bolivars.
func ConvertUsdToBs(amountUsd, rate float64) float64 {
	return amountUsd * rate
}
