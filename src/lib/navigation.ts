import {
  IconDashboard,
  IconUsers,
  IconSettings,
  IconFlask,
  IconFileDescription,
  IconChartBar,
  IconCreditCard,
  IconUserPlus,
  IconBuilding,
  IconMicroscope,
  type Icon,
} from "@tabler/icons-react";
import type { Permission } from "./permissions";

export interface NavItem {
  title: string;
  url: string;
  icon: Icon;
  requiredPermission?: Permission;
  items?: NavItem[];
}

export function getNavigationItems(orgSlug: string): NavItem[] {
  return [
    {
      title: "Dashboard",
      url: `/${orgSlug}/dashboard`,
      icon: IconDashboard,
    },
    {
      title: "Labs",
      url: `/${orgSlug}/labs`,
      icon: IconFlask,
      requiredPermission: "team:read",
    },
    {
      title: "Lab Tests",
      url: `/${orgSlug}/lab-tests`,
      icon: IconMicroscope,
      requiredPermission: "labTests:read",
    },
    {
      title: "Orders",
      url: `/${orgSlug}/orders`,
      icon: IconFileDescription,
      requiredPermission: "labOrders:read",
    },
    {
      title: "Results",
      url: `/${orgSlug}/results`,
      icon: IconChartBar,
      requiredPermission: "labResults:read",
    },
    {
      title: "Patients",
      url: `/${orgSlug}/patients`,
      icon: IconUsers,
      requiredPermission: "labPatients:read",
    },
    {
      title: "Settings",
      url: `/${orgSlug}/settings`,
      icon: IconSettings,
      requiredPermission: "labSettings:read",
      items: [
        {
          title: "Lab Settings",
          url: `/${orgSlug}/settings/lab`,
          icon: IconSettings,
          requiredPermission: "labSettings:read",
        },
        {
          title: "Billing",
          url: `/${orgSlug}/settings/billing`,
          icon: IconCreditCard,
          requiredPermission: "orgBilling:read",
        },
      ],
    },
  ];
}
