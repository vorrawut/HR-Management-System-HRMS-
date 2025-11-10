package utils

import (
	"time"
)

// ValidateDateRange validates that start date is before end date
func ValidateDateRange(startDate, endDate time.Time) error {
	if startDate.After(endDate) {
		return ErrInvalidDateRange
	}
	return nil
}

// ValidateDateNotPast validates that the date is not in the past
func ValidateDateNotPast(date time.Time) error {
	today := time.Now().Truncate(24 * time.Hour)
	if date.Before(today) {
		return ErrDateInPast
	}
	return nil
}

var (
	ErrInvalidDateRange = &ValidationError{Message: "start date must be before end date"}
	ErrDateInPast       = &ValidationError{Message: "date cannot be in the past"}
)

type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}

