"use server";

import { requirePermission } from "@/lib/server-permissions";
import { safeGetInvitation } from "@/lib/helpers/db-helpers";
import { safeCancelInvitation } from "@/lib/helpers/auth-helpers";
import {
  createSuccessResult,
  createErrorResult,
  revalidateOrgPaths,
  type ActionResult,
} from "@/lib/helpers/action-helpers";

export async function cancelInvitationAction(invitationId: string): Promise<ActionResult> {
  const { session } = await requirePermission("team:invite");
  const activeOrgId = session.session?.activeOrganizationId;
  const activeTeamId = session.session?.activeTeamId ?? null;

  if (!activeOrgId) {
    return createErrorResult("No active organization found.");
  }

  if (activeTeamId) {
    const [invitation, inviteError] = await safeGetInvitation(invitationId);

    if (inviteError) {
      return createErrorResult("Failed to fetch invitation details.");
    }

    if (invitation?.labId && invitation.labId !== activeTeamId) {
      return createErrorResult("You do not have permission to cancel this invitation.");
    }
  }

  const [result, error] = await safeCancelInvitation(invitationId);

  if (error) {
    return createErrorResult("Failed to cancel invitation.");
  }

  revalidateOrgPaths();
  return createSuccessResult(result);
}
