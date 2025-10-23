import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import type { Permission } from "./permissions";

export async function requirePermission(permission: Permission, redirectTo?: string) {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((m) => m.headers()),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // App-level admin has all permissions
  if (session.user.role === "admin") {
    return { session, hasPermission: true };
  }

  if (!session.session?.activeOrganizationId) {
    redirect("/onboarding");
  }

  // Get user's role in the active organization
  const userMember = await db.query.member.findFirst({
    where: (member, { and, eq }) =>
      and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, session.session.activeOrganizationId!),
      ),
  });

  if (!userMember) {
    redirect(redirectTo || "/unauthorized");
  }

  const hasPermission = checkRolePermission(userMember.role, permission);

  if (!hasPermission) {
    redirect(redirectTo || "/unauthorized");
  }

  return { session, hasPermission: true };
}

export async function checkPermission(permission: Permission): Promise<boolean> {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((m) => m.headers()),
  });

  if (!session?.user) return false;
  if (session.user.role === "admin") return true;
  if (!session.session?.activeOrganizationId) return false;

  const userMember = await db.query.member.findFirst({
    where: (member, { and, eq }) =>
      and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, session.session.activeOrganizationId!),
      ),
  });

  if (!userMember) return false;
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
}
