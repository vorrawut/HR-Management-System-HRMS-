"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui";
import { LoadingState } from "@/components/ui";
import { PageHeader } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import { PersonalInfo } from "@/components/dashboard";
import { PAGE_ROUTES } from "@/lib/routes";

export default function SecuredPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (status === "unauthenticated") {
      toast.showWarning("Access Denied. Please log in.");
      router.push(PAGE_ROUTES.LOGIN);
    }
  }, [status, router, toast]);

  if (status === "loading") {
    return <LoadingState />;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-6">
        <PageHeader title="Secured Page" backHref="/" />
        <Card>
          <CardHeader title={`Welcome, ${session?.user?.name || session?.user?.email}!`} />
          <CardContent>
            <PersonalInfo />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

