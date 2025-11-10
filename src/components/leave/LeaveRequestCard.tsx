"use client";

import { Card, CardHeader, CardContent, Badge, Button } from "@/components/ui";
import type { LeaveRequest as LeaveRequestType } from "@/lib/api/leave/services";
import { format } from "date-fns";

interface LeaveRequestCardProps {
  leave: LeaveRequestType;
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => void;
  showActions?: boolean;
}

export function LeaveRequestCard({
  leave,
  onEdit,
  onCancel,
  showActions = true,
}: LeaveRequestCardProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      case "cancelled":
        return "gray";
      default:
        return "blue";
    }
  };

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

  const canEdit = showActions && leave.status === "pending";

  return (
    <Card>
      <CardHeader
        title={
          <div className="flex items-center justify-between">
            <span>{getLeaveTypeLabel(leave.leaveType)}</span>
            <Badge variant={getStatusVariant(leave.status)}>
              {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
            </Badge>
          </div>
        }
      />
      <CardContent className="space-y-3 text-sm">
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
        {leave.managerComment && (
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Manager's Comment:
            </span>
            <p className="mt-1 text-gray-600 dark:text-gray-400">{leave.managerComment}</p>
          </div>
        )}
        <div className="text-xs text-gray-500 dark:text-gray-500">
          Submitted: {format(new Date(leave.createdAt), "MMM dd, yyyy 'at' HH:mm")}
        </div>
        {canEdit && (
          <div className="flex gap-2 pt-2">
            {onEdit && (
              <Button variant="secondary" size="sm" onClick={() => onEdit(leave.id)}>
                Edit
              </Button>
            )}
            {onCancel && (
              <Button variant="danger" size="sm" onClick={() => onCancel(leave.id)}>
                Cancel
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

