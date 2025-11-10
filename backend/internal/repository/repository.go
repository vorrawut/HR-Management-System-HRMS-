package repository

import "errors"

// Repository package provides data access layer interfaces and implementations
// for the Leave Management System.
//
// This package follows the Repository pattern to abstract database operations
// and make the code more testable and maintainable.

// ErrNotFound is returned when a requested resource is not found
var ErrNotFound = errors.New("resource not found")
