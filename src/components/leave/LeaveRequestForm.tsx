"use client";

import { useState, FormEvent } from "react";
import { Card, CardHeader, CardContent, Button, ErrorState } from "@/components/ui";
import type { CreateLeaveRequest, UpdateLeaveRequest } from "@/lib/api/leave/services";

interface LeaveRequestFormProps {
  initialData?: {
    leaveType?: string;
    reason?: string;
    startDate?: string;
    endDate?: string;
  };
  onSubmit: (data: CreateLeaveRequest | UpdateLeaveRequest) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function LeaveRequestForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Submit Request",
}: LeaveRequestFormProps) {
  const [leaveType, setLeaveType] = useState(initialData?.leaveType || "annual");
  const [reason, setReason] = useState(initialData?.reason || "");
  const [startDate, setStartDate] = useState(initialData?.startDate || "");
  const [endDate, setEndDate] = useState(initialData?.endDate || "");
  const [days, setDays] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) {
      setDays(0);
      return;
    }

    const startDateObj = new Date(start);
    const endDateObj = new Date(end);

    if (startDateObj > endDateObj) {
      setDays(0);
      return;
    }

    let count = 0;
    const current = new Date(startDateObj);

    while (current <= endDateObj) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    setDays(count);
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (endDate) {
      calculateDays(value, endDate);
    } else {
      setDays(0);
    }
    // Update end date min to be at least start date
    if (value && endDate && value > endDate) {
      setEndDate(value);
    }
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    if (startDate) {
      calculateDays(startDate, value);
    } else {
      setDays(0);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!leaveType || !reason || !startDate || !endDate) {
      setError("All fields are required");
      return;
    }

    if (days <= 0) {
      setError("Invalid date range");
      return;
    }

    if (reason.length < 10) {
      setError("Reason must be at least 10 characters");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        leaveType: leaveType as "annual" | "sick" | "personal" | "other",
        reason,
        startDate,
        endDate,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader title={initialData ? "Edit Leave Request" : "New Leave Request"} />
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorState message={error} />}

          <div>
            <label
              htmlFor="leaveType"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Leave Type
            </label>
            <select
              id="leaveType"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
            >
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal Leave</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              min={startDate || new Date().toISOString().split("T")[0]}
              disabled={!startDate}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
          </div>

          {days > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Total Leave Days: {days} day(s)
              </span>
            </div>
          )}

          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Reason <span className="text-gray-500">(minimum 10 characters)</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Please provide a detailed reason for your leave request..."
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              {reason.length}/10 characters minimum
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Submitting..." : submitLabel}
            </Button>
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

