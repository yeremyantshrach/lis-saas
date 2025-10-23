"use client";

import * as React from "react";
import { IconInnerShadowTop } from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { usePermissions } from "@/lib/permissions";
import { getNavigationItems } from "@/lib/navigation";
import { Skeleton } from "./ui/skeleton";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  orgSlug: string;
}

export function AppSidebar({ orgSlug, ...props }: AppSidebarProps) {
  const { data: session, isPending } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const { hasPermission } = usePermissions();

  const navigationItems = React.useMemo(() => {
    const allItems = getNavigationItems(orgSlug);

    const filterItems = (items: typeof allItems): typeof allItems => {
      return items.filter((item) => {
        if (!item.requiredPermission || hasPermission(item.requiredPermission)) {
          if (item.items) {
            item.items = filterItems(item.items);
          }
          return true;
        }
        return false;
      });
    };

    return filterItems(allItems);
  }, [orgSlug, hasPermission]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href={`/${orgSlug}/dashboard`}>
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">{activeOrg?.name || "LIS"}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigationItems} />
      </SidebarContent>
      <SidebarFooter>
        {isPending && <Skeleton />}
        {session && <NavUser user={session.user} />}
      </SidebarFooter>
    </Sidebar>
  );
}
