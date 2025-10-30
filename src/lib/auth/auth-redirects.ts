import { redirect } from "next/navigation";
import { safeGetSession } from "@/lib/helpers/auth-helpers";
import { auth } from "@/lib/auth";

export async function getServerAuthSession() {
  const [session, error] = await safeGetSession();
  return error ? null : session;
}

export function getPostAuthRedirect(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  const isGlobalAdmin = session?.user?.isGlobalAdmin ?? false;
  if (isGlobalAdmin || session?.user?.role === "admin") {
    return "/admin";
  }
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

export async function requireGlobalAdmin(fromPath = "/admin") {
  const session = await getServerAuthSession();

  if (!session?.user) {
    const search = fromPath ? `?from=${encodeURIComponent(fromPath)}` : "";
    redirect(`/sign-in${search}`);
  }

  const isAdmin = session.user.isGlobalAdmin || session.user.role === "admin";

  if (!isAdmin) {
    redirect(getPostAuthRedirect(session));
  }

  return session;
}
