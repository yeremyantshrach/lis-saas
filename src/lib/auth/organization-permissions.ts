import { defaultStatements, ownerAc, adminAc } from "better-auth/plugins/organization/access";
import { createAccessControl } from "better-auth/plugins/access";

/**
 * roles for app
 * - admin or super admin - full access to everything
 * - support user - read only access to everything
 *
 * roles for organization
 * - org-owner - full access to organization and billing
 * - lab-admin (team) - manage lab teams and settings
 * - lab-cls (clinical laboratory scientist) - manage orders and results
 * - lab-tech (laboratory technician) - assist with order processing
 * - lab-doc (laboratory doctor) - review and authorize results
 * - lab-receptionist - handle client interactions and sample intake
 */

const statement = {
  orgBilling: ["read", "create", "update", "delete"] as const,
  labSettings: ["read", "update"] as const,
  labOrders: ["read", "create", "update", "delete"] as const,
  labResults: ["read", "create", "update", "delete"] as const,
  labTests: ["read", "create", "update", "delete"] as const,
  labPatients: ["read", "create", "update", "delete"] as const,
  ...defaultStatements,
} as const;

export const organizationAccessControl = createAccessControl(statement);

export const orgOwner = organizationAccessControl.newRole({
  orgBilling: ["read", "update", "delete", "create"],
  labSettings: ["read", "update"],
  labOrders: ["read", "create", "update", "delete"],
  labResults: ["read", "create", "update", "delete"],
  labTests: ["read", "create", "update", "delete"],
  labPatients: ["read", "create", "update", "delete"],

  ...ownerAc.statements,
});

export const labAdmin = organizationAccessControl.newRole({
  labSettings: ["read", "update"],
  labOrders: ["read", "create", "update", "delete"],
  labResults: ["read", "create", "update", "delete"],
  labTests: ["read", "create", "update", "delete"],
  labPatients: ["read", "create", "update", "delete"],

  ...adminAc.statements,
});

export const labCls = organizationAccessControl.newRole({
  labOrders: ["read", "create", "update", "delete"],
  labResults: ["read", "create", "update", "delete"],
  labTests: ["read", "create", "update", "delete"],
  labPatients: ["read", "create", "update", "delete"],
});

export const labTech = organizationAccessControl.newRole({
  labOrders: ["read", "create", "update"],
  labResults: ["read", "create", "update"],
  labTests: ["read", "create", "update"],
  labPatients: ["read", "create", "update"],
});

export const labDoctor = organizationAccessControl.newRole({
  labResults: ["read", "update"],
  labTests: ["read", "update"],
  labPatients: ["read"],
});

export const labReceptionist = organizationAccessControl.newRole({
  labOrders: ["read", "create"],
  labTests: ["read"],
  labPatients: ["read", "create"],
});

export const organizationRoles = {
  "org-owner": orgOwner,
  "lab-admin": labAdmin,
  "lab-cls": labCls,
  "lab-tech": labTech,
  "lab-doctor": labDoctor,
  "lab-receptionist": labReceptionist,
};
