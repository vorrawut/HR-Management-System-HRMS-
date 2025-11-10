"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader, Card, CardHeader, CardContent, LoadingState, Button, ConfirmationModal } from "@/components/ui";
import { LeaveRequestCard, LeaveRequestForm } from "@/components/leave";
import { useToast } from "@/contexts/ToastContext";
import {
  getLeaveRequests,
  cancelLeaveRequest,
  updateLeaveRequest,
  createLeaveRequest,
  type LeaveRequest,
  type UpdateLeaveRequest,
  type CreateLeaveRequest,
} from "@/lib/api/leave/services";
import { PAGE_ROUTES } from "@/lib/routes";

export default function EmployeeLeavesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<{ id: string; employeeName: string } | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      loadLeaves();
    }
  }, [status]);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const data = await getLeaveRequests();
      // Ensure data is always an array
      setLeaves(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load leave requests";
      toast.showError(message);
      setLeaves([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleCancelClick = (id: string) => {
    const leave = leaves.find((l) => l.id === id);
    setConfirmCancel({ id, employeeName: leave?.employeeName || "this leave request" });
  };

  const handleCancelConfirm = async () => {
    if (!confirmCancel) return;

    try {
      await cancelLeaveRequest(confirmCancel.id);
      toast.showSuccess("Leave request cancelled successfully");
      setConfirmCancel(null);
      await loadLeaves();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to cancel leave request";
      toast.showError(message);
    }
  };

  const handleFormSubmit = async (data: CreateLeaveRequest | UpdateLeaveRequest) => {
    try {
      if (editingId) {
        await updateLeaveRequest(editingId, data as UpdateLeaveRequest);
        toast.showSuccess("Leave request updated successfully");
      } else {
        await createLeaveRequest(data as CreateLeaveRequest);
        toast.showSuccess("Leave request created successfully");
      }
      setEditingId(null);
      setShowForm(false);
      await loadLeaves();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit leave request";
      toast.showError(message);
    }
  };

  const handleFormCancel = () => {
    setEditingId(null);
    setShowForm(false);
  };

  if (status === "loading") {
    return <LoadingState message="Loading..." />;
  }

  if (status === "unauthenticated") {
    router.push(PAGE_ROUTES.LOGIN);
    return null;
  }

  const editingLeave = editingId ? leaves.find((l) => l.id === editingId) : null;

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PageHeader title="My Leave Requests" />

        <div className="mb-6">
        <Button
          variant="primary"
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
          }}
        >
          + New Leave Request
        </Button>
      </div>

      {showForm && (
        <div className="mb-6">
          <LeaveRequestForm
            initialData={editingLeave ? {
              leaveType: editingLeave.leaveType,
              reason: editingLeave.reason,
              startDate: editingLeave.startDate.includes("T") 
                ? editingLeave.startDate.split("T")[0] 
                : editingLeave.startDate,
              endDate: editingLeave.endDate.includes("T")
                ? editingLeave.endDate.split("T")[0]
                : editingLeave.endDate,
            } : undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            submitLabel={editingId ? "Update Request" : "Submit Request"}
          />
        </div>
      )}

      {loading ? (
        <LoadingState message="Loading leave requests..." />
      ) : leaves.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No leave requests yet. Create your first request above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {leaves.map((leave) => (
            <LeaveRequestCard
              key={leave.id}
              leave={leave}
              onEdit={leave.status === "pending" ? handleEdit : undefined}
              onCancel={leave.status === "pending" ? () => handleCancelClick(leave.id) : undefined}
            />
          ))}
        </div>
      )}
      </div>

      {confirmCancel && (
        <ConfirmationModal
          title="Cancel Leave Request"
          message={`Are you sure you want to cancel ${confirmCancel.employeeName}'s leave request? This action cannot be undone.`}
          confirmText="Cancel Request"
          cancelText="Keep Request"
          variant="warning"
          onConfirm={handleCancelConfirm}
          onCancel={() => setConfirmCancel(null)}
        />
      )}
    </>
  );
}

