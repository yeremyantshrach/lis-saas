"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { IconShield } from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getAdminNavigationItems } from "@/lib/navigation";
import { NavUser } from "@/components/nav-user";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { data: session, isPending } = authClient.useSession();
  const pathname = usePathname();
  const navItems = useMemo(() => getAdminNavigationItems(), []);
  const searchParams = useSearchParams();
  useEffect(() => {
    const url = `${pathname}?${searchParams}`;
    console.log(url);
    // You can now use the current URL
    // ...
  }, [pathname, searchParams]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:!p-1.5" asChild>
              <Link href="/admin">
                <IconShield className="!size-5" />
                <span className="text-base font-semibold">Admin Console</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/admin" && pathname.startsWith(`${item.url}/`));

                return (
                  <SidebarMenuItem key={item.url}>
                    <Link href={item.url}>
                      <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                        {item.icon && <item.icon className="!size-5" />}
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {isPending && <Skeleton className="h-12 w-full" />}
        {session && <NavUser user={session.user} />}
      </SidebarFooter>
    </Sidebar>
  );
}
