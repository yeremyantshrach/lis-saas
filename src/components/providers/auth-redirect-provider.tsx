"use client";

import { useEffect, PropsWithChildren } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function AuthRedirectProvider({ children }: PropsWithChildren<AuthRedirectProviderProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    // Don't redirect while loading
    if (isPending) return;

    const isAuthRoute = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
    const isOnboarding = pathname.startsWith("/onboarding");
    const isOrgDashboard = pathname.match(/^\/[^/]+\/dashboard/);
    const isRoot = pathname === "/";

    // User is logged in
    if (session?.user) {
      const orgSlug = session.session?.activeOrganizationSlug;

      // If user has an organization
      if (orgSlug) {
        // Redirect from auth pages or root to dashboard
        if (isAuthRoute || isRoot) {
          router.push(`/${orgSlug}/dashboard`);
        }
      } else {
        // User has no organization
        // Redirect from auth pages or root to onboarding
        if (isAuthRoute || isRoot) {
          router.push("/onboarding");
        }
        // Redirect from org dashboard to onboarding (they shouldn't be there)
        if (isOrgDashboard) {
          router.push("/onboarding");
        }
      }
    } else {
      // User is NOT logged in
      // Redirect from protected routes to sign-in
      if (isOrgDashboard || isOnboarding) {
        router.push(`/sign-in?from=${pathname}`);
      }
    }
  }, [session, isPending, pathname, router]);

  // Show loading state while checking auth
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
      </div>
    );
  }

  return <>{children}</>;
}
