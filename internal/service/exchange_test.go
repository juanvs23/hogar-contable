package service

import (
	"testing"
)

func TestConvertBsToUsd(t *testing.T) {
	tests := []struct {
		name     string
		amountBs float64
		rate     float64
		want     float64
	}{
		{"normal conversion", 1000, 50, 20},
		{"zero rate", 1000, 0, 0},
		{"zero amount", 0, 50, 0},
		{"negative rate", 100, -10, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ConvertBsToUsd(tt.amountBs, tt.rate)
			if got != tt.want {
				t.Errorf("ConvertBsToUsd(%f, %f) = %f; want %f", tt.amountBs, tt.rate, got, tt.want)
			}
		})
	}
}

func TestConvertUsdToBs(t *testing.T) {
	tests := []struct {
		name      string
		amountUsd float64
		rate      float64
		want      float64
	}{
		{"normal conversion", 20, 50, 1000},
		{"zero rate", 20, 0, 0},
		{"zero amount", 0, 50, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ConvertUsdToBs(tt.amountUsd, tt.rate)
			if got != tt.want {
				t.Errorf("ConvertUsdToBs(%f, %f) = %f; want %f", tt.amountUsd, tt.rate, got, tt.want)
			}
		})
	}
}
