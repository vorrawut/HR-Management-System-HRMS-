import { Suspense } from "react";
import { PrivateRoute } from "@/helpers/PrivateRoute";
import ManagerLeavesPage from "@/components/ManagerLeavesPage";
import { LoadingState } from "@/components/ui";

export default function ManagerLeavesRoute() {
  return (
    <PrivateRoute roles={["manager", "admin"]}>
      <Suspense fallback={<LoadingState message="Loading leaves..." />}>
        <ManagerLeavesPage />
      </Suspense>
    </PrivateRoute>
  );
}

