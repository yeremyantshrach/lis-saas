import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function getServerAuthSession() {
  const headerList = await headers();
  return auth.api.getSession({
    headers: headerList,
  });
}

export function getPostAuthRedirect(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  const orgSlug = session?.session?.activeOrganizationSlug;
  return orgSlug ? `/${orgSlug}/dashboard` : "/onboarding";
}

export async function redirectIfAuthenticated() {
  const session = await getServerAuthSession();

  if (session?.user) {
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
