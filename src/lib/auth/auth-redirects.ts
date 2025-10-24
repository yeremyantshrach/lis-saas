import { redirect } from "next/navigation";
import { safeGetSession } from "@/lib/helpers/auth-helpers";
import { auth } from "@/lib/auth";

export async function getServerAuthSession() {
  const [session, error] = await safeGetSession();
  return error ? null : session;
}

export function getPostAuthRedirect(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  const orgSlug = session?.session?.activeOrganizationSlug;
  return orgSlug ? `/${orgSlug}/dashboard` : "/onboarding";
}

interface RedirectIfAuthenticatedOptions {
  invitationId?: string;
}

export async function redirectIfAuthenticated(options?: RedirectIfAuthenticatedOptions) {
  const session = await getServerAuthSession();

  if (session?.user) {
    if (options?.invitationId) {
      redirect(`/invite/${encodeURIComponent(options.invitationId)}`);
    }

    redirect(getPostAuthRedirect(session));
  }

  return session;
}

export async function requireAuthenticated(fromPath: string) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    const search = fromPath ? `?from=${encodeURIComponent(fromPath)}` : "";
    redirect(`/sign-in${search}`);
  }

  return session;
}
