"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/server-permissions";
import { headers } from "next/headers";

export async function deleteLabAction(labId: string, organizationId: string) {
  await requirePermission("team:delete");

  try {
    const result = await auth.api.removeTeam({
      body: { organizationId, teamId: labId },
      headers: await headers(),
    });

    revalidatePath("/[orgSlug]/labs", "page");
    return { success: true, data: result };
  } catch (error) {
    console.log("error", error);
    return { success: false, error: "Failed to remove lab" };
  }
}
