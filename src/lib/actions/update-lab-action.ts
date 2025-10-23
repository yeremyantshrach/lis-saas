"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/server-permissions";
import { headers } from "next/headers";
import { createLabSchema } from "@/lib/validations/labs";

export async function updateLabAction(teamId: string, data: z.infer<typeof createLabSchema>) {
  await requirePermission("team:update");

  try {
    const result = await auth.api.updateTeam({
      body: {
        teamId,
        data: {
          name: data.name,
        },
      },
      headers: await headers(),
    });

    revalidatePath("/[orgSlug]/labs", "page");
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: "Failed to update lab" };
  }
}
