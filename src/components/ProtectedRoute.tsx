"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { useGetMeQuery } from "@/store/api/auth.api";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { isLoading, error } = useGetMeQuery();

  useEffect(() => {
    // If not loading and there's an auth error, redirect to login
    if (!isLoading && error) {
      router.replace("/");
    }
  }, [isLoading, error, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return null;
  }


  return <>{children}</>;
}