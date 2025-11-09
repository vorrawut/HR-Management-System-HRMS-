import { PrivateRoute } from "@/helpers/PrivateRoute";
import SecuredPage from "@/components/SecuredPage";

export default function SecuredPageRoute() {
  return (
    <PrivateRoute>
      <SecuredPage />
    </PrivateRoute>
  );
}

