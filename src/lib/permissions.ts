import { authClient } from "@/lib/auth-client";

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
  | "labPatients:read"
  | "labPatients:create"
  | "labPatients:update"
  | "labPatients:delete"
  | "orgBilling:read"
  | "orgBilling:create"
  | "orgBilling:update"
  | "orgBilling:delete";

export function usePermissions() {
  const { data: session } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();

  const hasPermission = (permission: Permission): boolean => {
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
        "labPatients:read",
        "labPatients:create",
        "labPatients:update",
        "labPatients:delete",
      ],
      "lab-tech": [
        "labOrders:read",
        "labOrders:create",
        "labOrders:update",
        "labResults:read",
        "labResults:create",
        "labResults:update",
        "labPatients:read",
        "labPatients:create",
        "labPatients:update",
      ],
      "lab-doctor": ["labResults:read", "labResults:update", "labPatients:read"],
      "lab-receptionist": [
        "labOrders:read",
        "labOrders:create",
        "labPatients:read",
        "labPatients:create",
      ],
    };

    return rolePermissions[role]?.includes(permission) ?? false;
  };

  const canCreateLab = () => hasPermission("team:create");
  const canInviteToOrg = () => hasPermission("org:invite") || hasPermission("team:invite");
  const canInviteToLab = () => hasPermission("team:invite");
  const canManageBilling = () => hasPermission("orgBilling:read");
  const canManageLabSettings = () => hasPermission("labSettings:update");

  return {
    hasPermission,
    canCreateLab,
    canInviteToOrg,
    canInviteToLab,
    canManageBilling,
    canManageLabSettings,
  };
}
