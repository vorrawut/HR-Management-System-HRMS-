"use client";

import { federatedLogout } from "@/lib/auth/federatedLogout";
import { Button } from "@/components/ui";

export default function Logout() {
  const handleLogout = () => {
    federatedLogout();
  };

  return (
    <Button onClick={handleLogout} variant="danger" size="lg" fullWidth className="md:w-[200px]">
      Logout
    </Button>
  );
}

