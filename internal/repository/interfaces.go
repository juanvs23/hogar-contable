package repository

import "hogar-contable/internal/core"

type TransactionRepository interface {
	Create(tx *core.Transaction) (int64, error)
	GetByID(id int64) (*core.Transaction, error)
	List(dateFrom, dateTo string, txType string) ([]core.Transaction, error)
	Update(tx *core.Transaction) error
	Delete(id int64) error
	GetTotals(dateFrom, dateTo string) (income, expenses float64, err error)
}

type CategoryRepository interface {
	Create(cat *core.Category) (int64, error)
	Update(cat *core.Category) error
	List(txType string) ([]core.Category, error)
	Delete(id int64) error
}

type ClosureRepository interface {
	Create(cl *core.Closure) (int64, error)
	GetByPeriod(period string, clType core.ClosureType) (*core.Closure, error)
	List(limit int) ([]core.Closure, error)
}

type ExchangeRateRepository interface {
	Save(rate *core.ExchangeRate) (int64, error)
	GetLatest(rateType core.RateType) (*core.ExchangeRate, error)
	GetHistory(rateType core.RateType, limit int) ([]core.ExchangeRate, error)
}
