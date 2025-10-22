import type { PropsWithChildren } from "react";
import { redirect } from "next/navigation";
import { getPostAuthRedirect, requireAuthenticated } from "@/lib/auth-redirects";

export default async function OrganizationLayout({
  children,
  params,
}: PropsWithChildren<PageProps<"/[orgSlug]/dashboard">>) {
  const { orgSlug } = await params;
  const session = await requireAuthenticated(`/${orgSlug}`);

  const activeOrgSlug = session.session?.activeOrganizationSlug;

  if (!activeOrgSlug) {
    redirect("/onboarding");
  }

  if (activeOrgSlug !== orgSlug) {
    redirect(getPostAuthRedirect(session));
  }

  return <>{children}</>;
}
