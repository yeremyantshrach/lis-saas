import { auth, Invitation } from "@/lib/auth";
import { tryCatch } from "@/lib/try-catch";
import { headers } from "next/headers";

export async function safeGetSession() {
  return tryCatch(
    auth.api.getSession({
      headers: await headers(),
    }),
  );
}

export async function safeSignInEmail(email: string, password: string) {
  return tryCatch(
    auth.api.signInEmail({
      body: { email, password },
    }),
  );
}

export async function safeSignUpEmail(email: string, password: string, name: string) {
  return tryCatch(
    auth.api.signUpEmail({
      body: { email, password, name },
    }),
  );
}

export async function safeCreateOrganization(name: string, slug: string) {
  return tryCatch(
    auth.api.createOrganization({
      body: { name, slug },
      headers: await headers(),
    }),
  );
}

export async function safeCreateTeam(name: string, organizationId: string) {
  return tryCatch(
    auth.api.createTeam({
      body: { name, organizationId },
      headers: await headers(),
    }),
  );
}

export async function safeRemoveTeam(organizationId: string, teamId: string) {
  return tryCatch(
    auth.api.removeTeam({
      body: { organizationId, teamId },
      headers: await headers(),
    }),
  );
}

export async function safeCreateInvitation(
  email: string,
  role: Invitation["role"],
  teamId: string,
  organizationId: string,
) {
  return tryCatch(
    auth.api.createInvitation({
      body: { email, role, teamId, organizationId },
      headers: await headers(),
    }),
  );
}

export async function safeAcceptInvitation(invitationId: string) {
  return tryCatch(
    auth.api.acceptInvitation({
      body: { invitationId },
      headers: await headers(),
    }),
  );
}

export async function safeCancelInvitation(invitationId: string) {
  return tryCatch(
    auth.api.cancelInvitation({
      body: { invitationId },
      headers: await headers(),
    }),
  );
}
