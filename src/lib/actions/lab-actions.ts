"use server";

import { z } from "zod";
import { requirePermission } from "@/lib/server-permissions";
import { createLabSchema, inviteSchema } from "../validations/labs";
import { safeCreateTeam, safeCreateInvitation } from "@/lib/helpers/auth-helpers";
import { safeGetLabsForOrganization } from "@/lib/helpers/db-helpers";
import {
  createSuccessResult,
  createErrorResult,
  revalidateOrgPaths,
  type ActionResult,
} from "@/lib/helpers/action-helpers";

export async function createLabAction(
  data: z.infer<typeof createLabSchema>,
): Promise<ActionResult> {
  const { session } = await requirePermission("team:create");
  const organizationId = session.session?.activeOrganizationId;

  if (!organizationId) {
    return createErrorResult("Select an organization before creating labs");
  }

  const [existingLabs, labsError] = await safeGetLabsForOrganization(organizationId);
  if (labsError) {
    console.error("Failed to load labs for duplicate check", labsError);
    return createErrorResult("Unable to verify lab uniqueness. Please try again.");
  }

  const normalizedName = data.name.trim().toLowerCase();
  const hasDuplicate = (existingLabs ?? []).some(
    (lab) => lab.name.trim().toLowerCase() === normalizedName,
  );

  if (hasDuplicate) {
    return createErrorResult("A lab with this name already exists in your organization.");
  }

  const [result, error] = await safeCreateTeam(data.name, organizationId);

  if (error) {
    return createErrorResult("Failed to create lab");
  }

  revalidateOrgPaths();
  return createSuccessResult(result);
}

export async function inviteToOrgAction(data: z.infer<typeof inviteSchema>): Promise<ActionResult> {
  const { session } = await requirePermission("team:invite");
  const activeTeamId = session.session?.activeTeamId ?? null;

  if (activeTeamId && data.teamId !== activeTeamId) {
    return createErrorResult("You can only invite members to your assigned lab.");
  }

  const [result, error] = await safeCreateInvitation(
    data.email,
    data.role,
    activeTeamId ?? data.teamId,
    session.session?.activeOrganizationId as string,
  );
  if (error) {
    return createErrorResult(error.message || "Failed to send invitation");
  }

  revalidateOrgPaths();
  return createSuccessResult(result);
}
