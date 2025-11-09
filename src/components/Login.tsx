"use client";

import { signIn } from "next-auth/react";

export default function Login() {
  const handleLogin = () => {
    signIn("keycloak", { callbackUrl: "/" });
  };

  return (
    <button
      onClick={handleLogin}
      className="flex h-12 w-full items-center justify-center rounded-full bg-blue-600 px-5 text-white transition-colors hover:bg-blue-700 md:w-[200px]"
    >
      Login with Keycloak
    </button>
  );
}

