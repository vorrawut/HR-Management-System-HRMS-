"use client";

import { Card, CardHeader, CardContent, Badge, Button } from "@/components/ui";
import type { LeaveRequest } from "@/lib/api/leave/services";
import { format } from "date-fns";

interface ManagerLeaveCardProps {
  leave: LeaveRequest;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function ManagerLeaveCard({
  leave,
  onApprove,
  onReject,
}: ManagerLeaveCardProps) {
  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case "annual":
        return "Annual Leave";
      case "sick":
        return "Sick Leave";
      case "personal":
        return "Personal Leave";
      case "other":
        return "Other";
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader
        title={
          <div className="flex items-center justify-between">
            <span>{leave.employeeName}</span>
            <Badge variant="blue">Pending</Badge>
          </div>
        }
      />
      <CardContent className="space-y-3 text-sm">
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Leave Type:</span>
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            {getLeaveTypeLabel(leave.leaveType)}
          </span>
        </div>
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Period:</span>
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            {format(new Date(leave.startDate), "MMM dd, yyyy")} -{" "}
            {format(new Date(leave.endDate), "MMM dd, yyyy")}
          </span>
        </div>
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Days:</span>
          <span className="ml-2 text-gray-600 dark:text-gray-400">{leave.days} day(s)</span>
        </div>
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Reason:</span>
          <p className="mt-1 text-gray-600 dark:text-gray-400">{leave.reason}</p>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-500">
          Submitted: {format(new Date(leave.createdAt), "MMM dd, yyyy 'at' HH:mm")}
        </div>
        <div className="flex gap-2 pt-2">
          {onApprove && (
            <Button variant="success" size="sm" onClick={() => onApprove(leave.id)}>
              Approve
            </Button>
          )}
          {onReject && (
            <Button variant="danger" size="sm" onClick={() => onReject(leave.id)}>
              Reject
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

