import { Suspense } from "react";
import { PrivateRoute } from "@/helpers/PrivateRoute";
import EmployeeLeavesPage from "@/components/EmployeeLeavesPage";
import { LoadingState } from "@/components/ui";

export default function EmployeeLeavesRoute() {
  return (
    <PrivateRoute>
      <Suspense fallback={<LoadingState message="Loading leaves..." />}>
        <EmployeeLeavesPage />
      </Suspense>
    </PrivateRoute>
  );
}

