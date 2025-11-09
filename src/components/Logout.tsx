"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export default function Logout() {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/logout");
  };

  return (
    <Button onClick={handleLogout} variant="danger" size="lg" fullWidth className="md:w-[200px]">
      Logout
    </Button>
  );
}

