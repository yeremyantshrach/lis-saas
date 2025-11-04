"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createErrorResult, type ActionResult } from "@/lib/helpers/action-helpers";
import { auth } from "@/lib/auth";
import { requireGlobalAdmin, getPostAuthRedirect } from "@/lib/auth/auth-redirects";
import { tryCatch } from "@/lib/try-catch";

export async function impersonateUserAction(
  userId: string,
  returnTo?: string,
): Promise<ActionResult> {
  const session = await requireGlobalAdmin("/admin/users");

  if (session.user.id === userId) {
    return createErrorResult("You are already signed in as this user.");
  }

  const requestHeaders = await headers();

  const [, impersonateError] = await tryCatch(
    auth.api.impersonateUser({
      body: { userId },
      headers: requestHeaders,
    }),
  );

  if (impersonateError) {
    const message =
      impersonateError instanceof Error ? impersonateError.message : "Unable to impersonate user.";
    return createErrorResult(message);
  }

  const [impersonatedSession] = await tryCatch(
    auth.api.getSession({
      headers: await headers(),
    }),
  );

  if (impersonatedSession) {
    redirect(returnTo ?? getPostAuthRedirect(impersonatedSession));
  }

  redirect(returnTo ?? "/");
}

export async function stopImpersonatingAction(returnTo?: string): Promise<ActionResult> {
  const requestHeaders = await headers();

  const [currentSession, sessionError] = await tryCatch(
    auth.api.getSession({
      headers: requestHeaders,
    }),
  );

  if (sessionError || !currentSession) {
    return createErrorResult("Unable to read current session.");
  }

  if (!currentSession.session?.impersonatedBy) {
    return createErrorResult("You are not currently impersonating a user.");
  }

  const [, stopError] = await tryCatch(
    auth.api.stopImpersonating({
      headers: requestHeaders,
    }),
  );

  if (stopError) {
    const message =
      stopError instanceof Error ? stopError.message : "Unable to stop impersonation.";
    return createErrorResult(message);
  }

  const [adminSession] = await tryCatch(
    auth.api.getSession({
      headers: await headers(),
    }),
  );

  if (adminSession) {
    redirect(returnTo ?? getPostAuthRedirect(adminSession));
  }

  redirect(returnTo ?? "/admin");
}
