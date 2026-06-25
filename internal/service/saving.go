package service

import (
	"hogar-contable/internal/core"
	"hogar-contable/internal/repository"
)

type SavingService struct {
	repo repository.SavingRepository
}

func NewSavingService(repo repository.SavingRepository) *SavingService {
	return &SavingService{repo: repo}
}

func (s *SavingService) Create(saving *core.Saving) (int64, error) {
	return s.repo.Create(saving)
}

func (s *SavingService) List() ([]core.Saving, error) {
	return s.repo.List()
}

func (s *SavingService) Update(saving *core.Saving) error {
	return s.repo.Update(saving)
}

func (s *SavingService) Delete(id int64) error {
	return s.repo.Delete(id)
}

type SavingTotal struct {
	TotalBs  float64 `json:"total_bs"`
	TotalUsd float64 `json:"total_usd"`
}

func (s *SavingService) GetTotal() (*SavingTotal, error) {
	bs, usd, err := s.repo.GetTotal()
	if err != nil {
		return nil, err
	}
	return &SavingTotal{TotalBs: bs, TotalUsd: usd}, nil
}
