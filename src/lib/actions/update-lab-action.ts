"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/server-permissions";
import { headers } from "next/headers";
import { createLabSchema } from "@/lib/validations/labs";
import { tryCatch } from "@/lib/try-catch";
import { safeGetLabsForOrganization } from "@/lib/helpers/db-helpers";

export async function updateLabAction(teamId: string, data: z.infer<typeof createLabSchema>) {
  const { session } = await requirePermission("team:update");
  const organizationId = session.session?.activeOrganizationId;

  if (!organizationId) {
    return { success: false, error: "Select an organization before updating labs" };
  }

  const [labs, labsError] = await safeGetLabsForOrganization(organizationId);
  if (labsError) {
    console.error("Failed to load labs for duplicate check", labsError);
    return { success: false, error: "Unable to verify lab uniqueness. Please try again." };
  }

  const normalizedName = data.name.trim().toLowerCase();
  const duplicate = (labs ?? []).some(
    (lab) => lab.id !== teamId && lab.name.trim().toLowerCase() === normalizedName,
  );

  if (duplicate) {
    return { success: false, error: "A lab with this name already exists in your organization." };
  }

  const [result, error] = await tryCatch(
    auth.api.updateTeam({
      body: {
        teamId,
        data: {
          name: data.name,
        },
      },
      headers: await headers(),
    }),
  );

  if (error || !result) {
    const message = error instanceof Error ? error.message : "Failed to update lab";
    return { success: false, error: message };
  }

  revalidatePath("/[orgSlug]/labs", "page");
  return { success: true, data: result };
}
