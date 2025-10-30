import { CSSProperties } from "react";

import { requireGlobalAdmin } from "@/lib/auth/auth-redirects";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminHeader } from "@/components/admin-header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireGlobalAdmin();

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AdminSidebar variant="inset" />
      <SidebarInset>
        <AdminHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
