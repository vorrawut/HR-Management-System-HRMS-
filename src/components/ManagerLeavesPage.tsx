"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader, LoadingState, ErrorState } from "@/components/ui";
import { ManagerLeaveCard, ApprovalModal } from "@/components/leave";
import {
  getPendingLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  type LeaveRequest,
} from "@/lib/api/leave/services";
import { PAGE_ROUTES } from "@/lib/routes";

export default function ManagerLeavesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    show: boolean;
    type: "approve" | "reject";
    leaveId: string;
    employeeName: string;
  } | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      loadLeaves();
    }
  }, [status]);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPendingLeaveRequests();
      setLeaves(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pending leave requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (id: string, employeeName: string) => {
    setModalState({
      show: true,
      type: "approve",
      leaveId: id,
      employeeName,
    });
  };

  const handleReject = (id: string, employeeName: string) => {
    setModalState({
      show: true,
      type: "reject",
      leaveId: id,
      employeeName,
    });
  };

  const handleModalConfirm = async (comment: string) => {
    if (!modalState) return;

    try {
      setProcessingId(modalState.leaveId);
      setError(null);

      if (modalState.type === "approve") {
        await approveLeaveRequest(modalState.leaveId, { comment });
      } else {
        await rejectLeaveRequest(modalState.leaveId, { comment });
      }

      setModalState(null);
      await loadLeaves();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process request");
      throw err; // Re-throw to let modal handle it
    } finally {
      setProcessingId(null);
    }
  };

  const handleModalCancel = () => {
    setModalState(null);
    setError(null);
  };

  if (status === "loading") {
    return <LoadingState message="Loading..." />;
  }

  if (status === "unauthenticated") {
    router.push(PAGE_ROUTES.LOGIN);
    return null;
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PageHeader title="Pending Leave Requests" />
        
        {error && !modalState && (
          <div className="mb-4">
            <ErrorState message={error} />
          </div>
        )}

        {loading ? (
          <LoadingState message="Loading pending leave requests..." />
        ) : leaves.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No pending leave requests at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaves.map((leave) => (
              <ManagerLeaveCard
                key={leave.id}
                leave={leave}
                onApprove={
                  processingId === leave.id
                    ? undefined
                    : () => handleApprove(leave.id, leave.employeeName)
                }
                onReject={
                  processingId === leave.id
                    ? undefined
                    : () => handleReject(leave.id, leave.employeeName)
                }
              />
            ))}
          </div>
        )}
      </div>

      {modalState && (
        <ApprovalModal
          type={modalState.type}
          employeeName={modalState.employeeName}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
        />
      )}
    </>
  );
}

