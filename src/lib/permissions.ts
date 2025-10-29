import { authClient } from "@/lib/auth-client";
import { useCallback, useMemo } from "react";

export type Permission =
  | "org:create"
  | "org:read"
  | "org:update"
  | "org:delete"
  | "org:invite"
  | "team:create"
  | "team:read"
  | "team:update"
  | "team:delete"
  | "team:invite"
  | "labSettings:read"
  | "labSettings:update"
  | "labOrders:read"
  | "labOrders:create"
  | "labOrders:update"
  | "labOrders:delete"
  | "labResults:read"
  | "labResults:create"
  | "labResults:update"
  | "labResults:delete"
  | "labTests:read"
  | "labTests:create"
  | "labTests:update"
  | "labTests:delete"
  | "labPatients:read"
  | "labPatients:create"
  | "labPatients:update"
  | "labPatients:delete"
  | "orgBilling:read"
  | "orgBilling:create"
  | "orgBilling:update"
  | "orgBilling:delete";

export function usePermissions() {
  const { data: session, isPending } = authClient.useSession();
  const { data: activeOrg, isPending: isPendingOrg } = authClient.useActiveOrganization();

  const isLoading = isPending || isPendingOrg;

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (isLoading) return false;
      if (!session?.user || !activeOrg) return false;

      // App-level admin has all permissions
      if (session.user?.role === "admin") return true;

      const userMember = activeOrg.members?.find((member) => {
        const memberUserId = member.userId ?? member.user?.id;
        return memberUserId === session.user.id;
      });
      if (!userMember) return false;

      const role = userMember.role;

      // Permission mapping based on roles (aligned with organization-permissions.ts)
      const rolePermissions: Record<string, Permission[]> = {
        "org-owner": [
          "org:create",
          "org:read",
          "org:update",
          "org:delete",
          "org:invite",
          "team:create",
          "team:read",
          "team:update",
          "team:delete",
          "team:invite",
          "labSettings:read",
          "labSettings:update",
          "labOrders:read",
          "labOrders:create",
          "labOrders:update",
          "labOrders:delete",
          "labResults:read",
          "labResults:create",
          "labResults:update",
          "labResults:delete",
          "labTests:read",
          "labTests:create",
          "labTests:update",
          "labTests:delete",
          "labPatients:read",
          "labPatients:create",
          "labPatients:update",
          "labPatients:delete",
          "orgBilling:read",
          "orgBilling:create",
          "orgBilling:update",
          "orgBilling:delete",
        ],
        "lab-admin": [
          "team:read",
          "team:invite",
          "labSettings:read",
          "labSettings:update",
          "labOrders:read",
          "labOrders:create",
          "labOrders:update",
          "labOrders:delete",
          "labResults:read",
          "labResults:create",
          "labResults:update",
          "labResults:delete",
          "labTests:read",
          "labTests:create",
          "labTests:update",
          "labTests:delete",
          "labPatients:read",
          "labPatients:create",
          "labPatients:update",
          "labPatients:delete",
        ],
        "lab-cls": [
          "labOrders:read",
          "labOrders:create",
          "labOrders:update",
          "labOrders:delete",
          "labResults:read",
          "labResults:create",
          "labResults:update",
          "labResults:delete",
          "labTests:read",
          "labTests:create",
          "labTests:update",
          "labTests:delete",
          "labPatients:read",
          "labPatients:create",
          "labPatients:update",
          "labPatients:delete",
        ],
        "lab-technician": [
          "labOrders:read",
          "labOrders:create",
          "labOrders:update",
          "labResults:read",
          "labResults:create",
          "labResults:update",
          "labTests:read",
          "labTests:create",
          "labTests:update",
          "labPatients:read",
          "labPatients:create",
          "labPatients:update",
        ],
        "lab-doctor": [
          "labResults:read",
          "labResults:update",
          "labTests:read",
          "labTests:update",
          "labPatients:read",
        ],
        "lab-receptionist": [
          "labOrders:read",
          "labOrders:create",
          "labTests:read",
          "labPatients:read",
          "labPatients:create",
        ],
      };

      return rolePermissions[role]?.includes(permission) ?? false;
    },
    [session, activeOrg, isLoading],
  );
  const canCreateLab = useMemo(() => hasPermission("team:create"), [hasPermission]);
  const canInviteToOrg = useMemo(
    () => hasPermission("org:invite") || hasPermission("team:invite"),
    [hasPermission],
  );
  const canInviteToLab = useMemo(() => hasPermission("team:invite"), [hasPermission]);
  const canManageBilling = useMemo(() => hasPermission("orgBilling:read"), [hasPermission]);
  const canManageLabSettings = useMemo(() => hasPermission("labSettings:update"), [hasPermission]);

  return {
    hasPermission,
    canCreateLab,
    canInviteToOrg,
    canInviteToLab,
    canManageBilling,
    canManageLabSettings,
    isLoading,
  };
}
