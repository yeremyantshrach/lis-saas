import { redirect } from "next/navigation";
import type { Permission } from "./permissions";
import { safeGetUserMember } from "@/lib/helpers/db-helpers";
import { safeGetSession } from "@/lib/helpers/auth-helpers";

export async function requirePermission(permission: Permission, redirectTo?: string) {
  const [session, sessionError] = await safeGetSession();

  if (sessionError || !session?.user) {
    redirect("/sign-in");
  }

  if (session.user.role === "admin") {
    return { session, hasPermission: true };
  }

  if (!session.session?.activeOrganizationId) {
    redirect("/onboarding");
  }

  const [userMember, memberError] = await safeGetUserMember(
    session.user.id,
    session.session.activeOrganizationId,
  );

  if (memberError || !userMember) {
    redirect(redirectTo || "/unauthorized");
  }

  const hasPermission = checkRolePermission(userMember.role, permission);

  if (!hasPermission) {
    redirect(redirectTo || "/unauthorized");
  }

  return { session, hasPermission: true };
}

export async function checkPermission(permission: Permission): Promise<boolean> {
  const [session, sessionError] = await safeGetSession();

  if (sessionError || !session?.user) return false;
  if (session.user.role === "admin") return true;
  if (!session.session?.activeOrganizationId) return false;

  const [userMember, memberError] = await safeGetUserMember(
    session.user.id,
    session.session.activeOrganizationId,
  );

  if (memberError || !userMember) return false;
  return checkRolePermission(userMember.role, permission);
}

function checkRolePermission(role: string, permission: Permission): boolean {
  // Aligned with organization-permissions.ts role definitions
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
    "lab-tech": [
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
}
