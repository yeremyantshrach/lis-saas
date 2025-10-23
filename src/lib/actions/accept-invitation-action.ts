"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function acceptInvitationAction(invitationId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, error: "You must be signed in to accept an invitation." };
  }

  try {
    const result = await auth.api.acceptInvitation({
      body: { invitationId },
      headers: await headers(),
    });

    // Revalidate dashboard and labs layouts for any organization slugs using dynamic segments.
    revalidatePath("/[orgSlug]/dashboard", "page");
    revalidatePath("/[orgSlug]/labs", "page");

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to accept invitation", error);
    return { success: false, error: "Failed to accept invitation." };
  }
}
