"use client";

import { useState, FormEvent } from "react";
import { Card, CardHeader, CardContent, Button, ErrorState } from "@/components/ui";

interface ApprovalModalProps {
  type: "approve" | "reject";
  employeeName: string;
  onConfirm: (comment: string) => Promise<void>;
  onCancel: () => void;
}

export function ApprovalModal({
  type,
  employeeName,
  onConfirm,
  onCancel,
}: ApprovalModalProps) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReject = type === "reject";
  const title = isReject ? "Reject Leave Request" : "Approve Leave Request";
  const buttonText = isReject ? "Reject Request" : "Approve Request";
  const buttonVariant = isReject ? "danger" : "success";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isReject && (!comment.trim() || comment.trim().length < 10)) {
      setError("Rejection reason is required and must be at least 10 characters");
      return;
    }

    setLoading(true);
    try {
      await onConfirm(comment.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process request");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader title={title} />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isReject
                ? `Are you sure you want to reject ${employeeName}'s leave request? Please provide a reason.`
                : `Approve ${employeeName}'s leave request. You can optionally add a comment.`}
            </p>

            {error && <ErrorState message={error} />}

            <div>
              <label
                htmlFor="comment"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {isReject ? "Rejection Reason" : "Comment (Optional)"}
                {isReject && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder={
                  isReject
                    ? "Please provide a detailed reason for rejection (minimum 10 characters)..."
                    : "Add an optional comment..."
                }
                required={isReject}
              />
              {isReject && (
                <p className="mt-1 text-xs text-gray-500">
                  {comment.length}/10 characters minimum
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant={buttonVariant} disabled={loading}>
                {loading ? "Processing..." : buttonText}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

