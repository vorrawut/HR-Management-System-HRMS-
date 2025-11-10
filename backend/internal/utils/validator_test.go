package utils

import (
	"testing"
	"time"
)

func TestValidateDateRange(t *testing.T) {
	tests := []struct {
		name      string
		startDate time.Time
		endDate   time.Time
		wantErr   bool
	}{
		{
			name:      "valid range",
			startDate: time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
			endDate:   time.Date(2024, 1, 5, 0, 0, 0, 0, time.UTC),
			wantErr:   false,
		},
		{
			name:      "same date",
			startDate: time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
			endDate:   time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
			wantErr:   false,
		},
		{
			name:      "invalid range - end before start",
			startDate: time.Date(2024, 1, 5, 0, 0, 0, 0, time.UTC),
			endDate:   time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
			wantErr:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateDateRange(tt.startDate, tt.endDate)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error but got none")
					return
				}
				if err != ErrInvalidDateRange {
					t.Errorf("expected ErrInvalidDateRange, got %v", err)
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
			}
		})
	}
}

func TestValidateDateNotPast(t *testing.T) {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)

	tests := []struct {
		name    string
		date    time.Time
		wantErr bool
	}{
		{
			name:    "today",
			date:    today,
			wantErr: false,
		},
		{
			name:    "future date",
			date:    today.AddDate(0, 0, 1),
			wantErr: false,
		},
		{
			name:    "past date",
			date:    today.AddDate(0, 0, -1),
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateDateNotPast(tt.date)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error but got none")
					return
				}
				if err != ErrDateInPast {
					t.Errorf("expected ErrDateInPast, got %v", err)
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
			}
		})
	}
}

