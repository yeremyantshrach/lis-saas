import type { PropsWithChildren } from "react";
import { redirect } from "next/navigation";
import { CSSProperties } from "react";
import { getPostAuthRedirect, requireAuthenticated } from "@/lib/auth/auth-redirects";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function OrganizationLayout({ children, params }: LayoutProps<"/[orgSlug]">) {
  const { orgSlug } = await params;
  const session = await requireAuthenticated(`/${orgSlug}`);

  const activeOrgSlug = session.session?.activeOrganizationSlug;

  if (!activeOrgSlug) {
    redirect("/onboarding");
  }

  if (activeOrgSlug !== orgSlug) {
    redirect(getPostAuthRedirect(session));
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" orgSlug={orgSlug} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
