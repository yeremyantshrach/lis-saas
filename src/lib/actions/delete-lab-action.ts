"use server";

import { requirePermission } from "@/lib/server-permissions";
import { safeRemoveTeam } from "@/lib/helpers/auth-helpers";
import {
  createSuccessResult,
  createErrorResult,
  revalidateOrgPaths,
  type ActionResult,
} from "@/lib/helpers/action-helpers";

export async function deleteLabAction(
  labId: string,
  organizationId: string,
): Promise<ActionResult> {
  await requirePermission("team:delete");

  const [result, error] = await safeRemoveTeam(organizationId, labId);

  if (error) {
    return createErrorResult("Failed to remove lab");
  }

  revalidateOrgPaths();
  return createSuccessResult(result);
}
