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
import { db } from "@/lib/database";
import { labTeamMember } from "@/lib/schema";

export async function updateMemberAction(
  data: z.infer<typeof updateMemberSchema>,
): Promise<ActionResult> {
  try {
    // Check permissions: org-owner can update any member, lab-admin can update members in their lab
    const { session } = await requirePermission("team:invite");

    if (!session.session?.activeOrganizationId) {
      return createErrorResult("No active organization");
    }

    const requestHeaders = await headers();

    // Update member role via Better Auth API
    const response = await auth.api.updateMemberRole({
      body: {
        memberId: data.memberId,
        role: data.role,
        organizationId: session.session.activeOrganizationId,
      },
      headers: requestHeaders,
    });

    if (!response) {
      return createErrorResult("Failed to update member role");
    }

    const memberRecord = await db.query.member.findFirst({
      where: (memberAlias, { eq }) => eq(memberAlias.id, data.memberId),
      columns: { id: true, userId: true, organizationId: true },
    });

    if (!memberRecord || !memberRecord.userId) {
      return createErrorResult("Member not found");
    }

    if (memberRecord.organizationId !== session.session.activeOrganizationId) {
      return createErrorResult("You can only update members in your active organization");
    }

    const existingMembership = await db.query.labTeamMember.findFirst({
      where: (ltm, { eq }) => eq(ltm.userId, memberRecord.userId),
      with: { lab: true },
    });

    const requestedTeamId = data.teamId?.trim();

    if (requestedTeamId) {
      const targetLab = await db.query.labs.findFirst({
        where: (lab, { and, eq }) =>
          and(eq(lab.id, requestedTeamId), eq(lab.organizationId, memberRecord.organizationId)),
        columns: { id: true },
      });

      if (!targetLab) {
        return createErrorResult("Selected lab is not part of this organization");
      }

      if (existingMembership?.labId && existingMembership.labId !== requestedTeamId) {
        await auth.api.removeTeamMember({
          body: { teamId: existingMembership.labId, userId: memberRecord.userId },
          headers: requestHeaders,
        });
      }

      if (!existingMembership || existingMembership.labId !== requestedTeamId) {
        await auth.api.addTeamMember({
          body: { teamId: requestedTeamId, userId: memberRecord.userId },
          headers: requestHeaders,
        });
      }
    } else if (existingMembership?.labId) {
      await auth.api.removeTeamMember({
        body: { teamId: existingMembership.labId, userId: memberRecord.userId },
        headers: requestHeaders,
      });
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
