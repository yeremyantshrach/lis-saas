"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/server-permissions";
import { headers } from "next/headers";
import { createLabSchema } from "@/lib/validations/labs";
import { tryCatch } from "@/lib/try-catch";

export async function updateLabAction(teamId: string, data: z.infer<typeof createLabSchema>) {
  await requirePermission("team:update");

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
