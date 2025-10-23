import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

const statement = {
  organization: ["read", "create", "update", "delete"],
  labs: ["read", "create", "update", "delete"],
  orders: ["read", "create", "update", "delete"],
  results: ["read", "create", "update", "delete"],
  ...defaultStatements,
} as const;

export const adminAccessControl = createAccessControl(statement);

export const admin = adminAccessControl.newRole({
  organization: ["read", "create", "update", "delete"],
  labs: ["read", "create", "update", "delete"],
  orders: ["read", "create", "update", "delete"],
  results: ["read", "create", "update", "delete"],
  ...adminAc.statements,
});

export const support = adminAccessControl.newRole({
  organization: ["read"],
  labs: ["read"],
  orders: ["read"],
  results: ["read"],
});
