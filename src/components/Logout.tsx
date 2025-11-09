"use client";

import { federatedLogout } from "@/utils/federatedLogout";

export default function Logout() {
  const handleLogout = () => {
    federatedLogout();
  };

  return (
    <button
      onClick={handleLogout}
      className="flex h-12 w-full items-center justify-center rounded-full bg-red-600 px-5 text-white transition-colors hover:bg-red-700 md:w-[200px]"
    >
      Logout
    </button>
  );
}

