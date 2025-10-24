"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/server-permissions";
import { headers } from "next/headers";
import { createLabSchema, inviteSchema } from "../validations/labs";

export async function createLabAction(data: z.infer<typeof createLabSchema>) {
  const { session } = await requirePermission("team:create");

  try {
    const result = await auth.api.createTeam({
      body: {
        name: data.name,
        organizationId: session.session?.activeOrganizationId as string,
      },
      headers: await headers(),
    });

    revalidatePath("/[orgSlug]/labs", "page");
    return { success: true, data: result };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Failed to create lab" };
  }
}

export async function inviteToOrgAction(data: z.infer<typeof inviteSchema>) {
  const { session } = await requirePermission("team:invite");
  const activeTeamId = session.session?.activeTeamId ?? null;

  try {
    if (activeTeamId && data.teamId !== activeTeamId) {
      return { success: false, error: "You can only invite members to your assigned lab." };
    }

    // Placeholder - needs proper Better Auth organization plugin setup
    const body = {
        email: data.email,
        role: data.role,
        teamId: activeTeamId ?? data.teamId,
        organizationId: session.session?.activeOrganizationId as string,
      };
      console.log('body', body)
    const result = await auth.api.createInvitation({
      body: {
        email: data.email,
        role: data.role,
        teamId: activeTeamId ?? data.teamId,
        organizationId: session.session?.activeOrganizationId as string,
      },
      headers: await headers(),
    });

    revalidatePath("/[orgSlug]/labs", "page");
    return { success: true, data: result };
  } catch (error) {
    console.log("error", JSON.stringify(error));
    return { success: false, error: "Failed to send invitation" };
  }
}
