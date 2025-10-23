"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/server-permissions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/database";

export async function cancelInvitationAction(invitationId: string) {
  const { session } = await requirePermission("team:invite");
  const activeOrgId = session.session?.activeOrganizationId;
  const activeTeamId = session.session?.activeTeamId ?? null;

  if (!activeOrgId) {
    return { success: false, error: "No active organization found." };
  }

  if (activeTeamId) {
    const invitation = await db.query.invitation.findFirst({
      where: (invitation, { eq }) => eq(invitation.id, invitationId),
      columns: {
        labId: true,
      },
    });

    if (invitation?.labId && invitation.labId !== activeTeamId) {
      return { success: false, error: "You do not have permission to cancel this invitation." };
    }
  }

  try {
    await auth.api.cancelInvitation({
      body: {
        invitationId: invitationId,
      },
      headers: await headers(),
    });

    revalidatePath("/[orgSlug]/labs", "page");
    return { success: true };
  } catch (error) {
    console.error("cancelInvitationAction", error);
    return { success: false, error: "Failed to cancel invitation." };
  }
}
