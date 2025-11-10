package models

import (
	"testing"
	"time"
)

func TestCalculateDays(t *testing.T) {
	tests := []struct {
		name      string
		startDate time.Time
		endDate   time.Time
		want      int
	}{
		{
			name:      "single weekday",
			startDate: time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), // Monday
			endDate:   time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
			want:      1,
		},
		{
			name:      "week spanning Monday to Friday",
			startDate: time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), // Monday
			endDate:   time.Date(2024, 1, 5, 0, 0, 0, 0, time.UTC), // Friday
			want:      5,
		},
		{
			name:      "week spanning Monday to Sunday (excludes weekend)",
			startDate: time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), // Monday
			endDate:   time.Date(2024, 1, 7, 0, 0, 0, 0, time.UTC), // Sunday
			want:      5, // Mon-Fri only
		},
		{
			name:      "two full weeks",
			startDate: time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), // Monday
			endDate:   time.Date(2024, 1, 14, 0, 0, 0, 0, time.UTC), // Sunday (2 weeks later)
			want:      10, // 2 weeks * 5 weekdays
		},
		{
			name:      "weekend only (should return 0)",
			startDate: time.Date(2024, 1, 6, 0, 0, 0, 0, time.UTC), // Saturday
			endDate:   time.Date(2024, 1, 7, 0, 0, 0, 0, time.UTC), // Sunday
			want:      0,
		},
		{
			name:      "Friday to Monday (excludes weekend)",
			startDate: time.Date(2024, 1, 5, 0, 0, 0, 0, time.UTC), // Friday
			endDate:   time.Date(2024, 1, 8, 0, 0, 0, 0, time.UTC), // Monday
			want:      2, // Friday and Monday only
		},
		{
			name:      "long period with multiple weekends",
			startDate: time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), // Monday
			endDate:   time.Date(2024, 1, 31, 0, 0, 0, 0, time.UTC), // Wednesday (end of month)
			want:      23, // Approximate: 31 days - 8-9 weekends = ~23 weekdays
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := CalculateDays(tt.startDate, tt.endDate)
			if got != tt.want {
				t.Errorf("CalculateDays() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestLeaveType_String(t *testing.T) {
	tests := []struct {
		lt   LeaveType
		want string
	}{
		{LeaveTypeAnnual, "annual"},
		{LeaveTypeSick, "sick"},
		{LeaveTypePersonal, "personal"},
		{LeaveTypeOther, "other"},
	}

	for _, tt := range tests {
		t.Run(string(tt.lt), func(t *testing.T) {
			if string(tt.lt) != tt.want {
				t.Errorf("LeaveType.String() = %v, want %v", string(tt.lt), tt.want)
			}
		})
	}
}

func TestLeaveStatus_String(t *testing.T) {
	tests := []struct {
		ls   LeaveStatus
		want string
	}{
		{LeaveStatusPending, "pending"},
		{LeaveStatusApproved, "approved"},
		{LeaveStatusRejected, "rejected"},
		{LeaveStatusCancelled, "cancelled"},
	}

	for _, tt := range tests {
		t.Run(string(tt.ls), func(t *testing.T) {
			if string(tt.ls) != tt.want {
				t.Errorf("LeaveStatus.String() = %v, want %v", string(tt.ls), tt.want)
			}
		})
	}
}

