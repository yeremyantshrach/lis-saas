"use server";

import { z } from "zod";
import { requirePermission } from "@/lib/server-permissions";
import {
  createSuccessResult,
  createErrorResult,
  revalidateOrgPaths,
  type ActionResult,
} from "@/lib/helpers/action-helpers";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { removeMemberSchema, updateMemberSchema } from "@/lib/validations/members";

export async function updateMemberAction(
  data: z.infer<typeof updateMemberSchema>,
): Promise<ActionResult> {
  try {
    // Check permissions: org-owner can update any member, lab-admin can update members in their lab
    const { session } = await requirePermission("team:invite");

    if (!session.session?.activeOrganizationId) {
      return createErrorResult("No active organization");
    }

    // Update member role via Better Auth API
    const response = await auth.api.updateMemberRole({
      body: {
        memberId: data.memberId,
        role: data.role,
        organizationId: session.session.activeOrganizationId,
      },
      headers: await headers(),
    });

    if (!response) {
      return createErrorResult("Failed to update member role");
    }

    // If teamId is provided, we need to update the lab team membership
    if (data.teamId) {
      // This requires direct database manipulation
      // For now, we'll handle this in a separate step
      // TODO: Implement lab team membership update
    }

    revalidateOrgPaths();
    return createSuccessResult({ success: true });
  } catch (error) {
    console.error("Error updating member:", error);
    return createErrorResult("Failed to update member. Please try again.");
  }
}

export async function removeMemberAction(
  data: z.infer<typeof removeMemberSchema>,
): Promise<ActionResult> {
  try {
    // Check permissions: org-owner can remove any member, lab-admin can remove members from their lab
    const { session } = await requirePermission("team:invite");

    if (!session.session?.activeOrganizationId) {
      return createErrorResult("No active organization");
    }

    // Remove member via Better Auth API
    const response = await auth.api.removeMember({
      body: {
        memberIdOrEmail: data.memberId,
        organizationId: session.session.activeOrganizationId,
      },
      headers: await headers(),
    });

    if (!response) {
      return createErrorResult("Failed to remove member");
    }

    revalidateOrgPaths();
    return createSuccessResult({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return createErrorResult("Failed to remove member. Please try again.");
  }
}
