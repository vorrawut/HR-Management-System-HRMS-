"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export default function Login() {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <Button onClick={handleLogin} variant="primary" size="lg" fullWidth className="md:w-[200px]">
      Login with Keycloak
    </Button>
  );
}

