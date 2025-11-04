export function parseUserRoles(role: string | null | undefined): string[] {
  if (!role) {
    return [];
  }

  return role
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export function hasUserRole(role: string | null | undefined, targetRole: string): boolean {
  if (!targetRole) return false;
  return parseUserRoles(role).some((value) => value.toLowerCase() === targetRole.toLowerCase());
}

export function isGlobalAdminRole(role: string | null | undefined): boolean {
  return hasUserRole(role, "admin");
}
