"use server";

import { safeGetSession, safeAcceptInvitation } from "@/lib/helpers/auth-helpers";
import {
  createSuccessResult,
  createErrorResult,
  revalidateOrgPaths,
  type ActionResult,
} from "@/lib/helpers/action-helpers";

export async function acceptInvitationAction(invitationId: string): Promise<ActionResult> {
  const [session, sessionError] = await safeGetSession();

  if (sessionError || !session?.user) {
    return createErrorResult("You must be signed in to accept an invitation.");
  }

  const [result, error] = await safeAcceptInvitation(invitationId);

  if (error) {
    return createErrorResult("Failed to accept invitation.");
  }

  revalidateOrgPaths();
  return createSuccessResult(result);
}
