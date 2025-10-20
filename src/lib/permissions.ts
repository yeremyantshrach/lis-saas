import { createAccessControl } from "better-auth/plugins/access";

export type AutoAssignGroup = "owner" | "admin" | "member";

export const APP_PERMISSION_STATEMENT = {
  app: ["manageUsers", "manageSupport", "impersonate", "viewBilling"],
} as const;

export const ORGANIZATION_PERMISSION_STATEMENT = {
  organization: [
    "read",
    "update",
    "delete",
    "manageMembers",
    "invite",
    "manageRoles",
    "manageLabs",
  ],
  lab: [
    "create",
    "read",
    "update",
    "delete",
    "manageMembers",
    "manageRoles",
    "managePermissions",
  ],
  labRole: ["create", "update", "delete"],
  labPermission: ["assign"],
} as const;

type OrganizationPermissionKey = keyof typeof ORGANIZATION_PERMISSION_STATEMENT;
type OrganizationPermissionValue<
  K extends OrganizationPermissionKey,
> = (typeof ORGANIZATION_PERMISSION_STATEMENT)[K][number];

export type PermissionDefinition = Partial<{
  [K in OrganizationPermissionKey]: OrganizationPermissionValue<K>[];
}>;

export type RolePermissionMap = PermissionDefinition;

export const appAccessControl = createAccessControl(APP_PERMISSION_STATEMENT);
export const organizationAccessControl = createAccessControl(
  ORGANIZATION_PERMISSION_STATEMENT,
);

type OrganizationRoleConfig = Parameters<
  typeof organizationAccessControl["newRole"]
>[0];

const definePermissions = <T extends PermissionDefinition>(
  definition: T,
): PermissionDefinition => definition;

export const appAdminRole = appAccessControl.newRole({
  app: [...APP_PERMISSION_STATEMENT.app],
});

export const supportRole = appAccessControl.newRole({
  app: ["manageUsers", "manageSupport"],
});

const OWNER_ORGANIZATION_PERMISSIONS: OrganizationPermissionValue<
  "organization"
>[] = [
  "read",
  "update",
  "delete",
  "manageMembers",
  "invite",
  "manageRoles",
  "manageLabs",
];

const OWNER_LAB_PERMISSIONS: OrganizationPermissionValue<"lab">[] = [
  "create",
  "read",
  "update",
  "delete",
  "manageMembers",
  "manageRoles",
  "managePermissions",
];

const OWNER_LAB_ROLE_PERMISSIONS: OrganizationPermissionValue<"labRole">[] = [
  "create",
  "update",
  "delete",
];

const OWNER_LAB_PERMISSION_PERMISSIONS: OrganizationPermissionValue<
  "labPermission"
>[] = ["assign"];

const ORGANIZATION_OWNER_PERMISSIONS: OrganizationRoleConfig = {
  organization: OWNER_ORGANIZATION_PERMISSIONS,
  lab: OWNER_LAB_PERMISSIONS,
  labRole: OWNER_LAB_ROLE_PERMISSIONS,
  labPermission: OWNER_LAB_PERMISSION_PERMISSIONS,
};

export const organizationOwnerRole =
  organizationAccessControl.newRole(ORGANIZATION_OWNER_PERMISSIONS);

const ADMIN_ORGANIZATION_PERMISSIONS: OrganizationPermissionValue<
  "organization"
>[] = [
  "read",
  "update",
  "manageMembers",
  "invite",
  "manageRoles",
  "manageLabs",
];

const ADMIN_LAB_PERMISSIONS: OrganizationPermissionValue<"lab">[] = [
  "create",
  "read",
  "update",
  "delete",
  "manageMembers",
  "manageRoles",
  "managePermissions",
];

const ADMIN_LAB_ROLE_PERMISSIONS: OrganizationPermissionValue<"labRole">[] = [
  "create",
  "update",
  "delete",
];

const ADMIN_LAB_PERMISSION_PERMISSIONS: OrganizationPermissionValue<
  "labPermission"
>[] = ["assign"];

const ORGANIZATION_ADMIN_PERMISSIONS: OrganizationRoleConfig = {
  organization: ADMIN_ORGANIZATION_PERMISSIONS,
  lab: ADMIN_LAB_PERMISSIONS,
  labRole: ADMIN_LAB_ROLE_PERMISSIONS,
  labPermission: ADMIN_LAB_PERMISSION_PERMISSIONS,
};

export const organizationAdminRole = organizationAccessControl.newRole(
  ORGANIZATION_ADMIN_PERMISSIONS,
);

export const organizationMemberRole = organizationAccessControl.newRole({
  organization: ["read"],
  lab: ["read"],
});

type LabRoleDefinitionBase = {
  key: string;
  name: string;
  description: string;
  permissions: PermissionDefinition;
  autoAssign: readonly AutoAssignGroup[];
};

export const LAB_ROLE_DEFINITIONS: readonly LabRoleDefinitionBase[] = [
  {
    key: "lab_owner",
    name: "Lab Owner",
    description: "Full access to all lab resources and configuration.",
    permissions: definePermissions({
      lab: [
        "read",
        "update",
        "delete",
        "manageMembers",
        "manageRoles",
        "managePermissions",
      ] as OrganizationPermissionValue<"lab">[],
      labRole: ["create", "update", "delete"] as OrganizationPermissionValue<
        "labRole"
      >[],
      labPermission: ["assign"] as OrganizationPermissionValue<"labPermission">[],
    }),
    autoAssign: ["owner"] as const,
  },
  {
    key: "lab_admin",
    name: "Lab Administrator",
    description: "Manage lab configuration, team, and role assignments.",
    permissions: definePermissions({
      lab: [
        "read",
        "update",
        "manageMembers",
        "manageRoles",
        "managePermissions",
      ] as OrganizationPermissionValue<"lab">[],
      labRole: ["create", "update", "delete"] as OrganizationPermissionValue<
        "labRole"
      >[],
      labPermission: ["assign"] as OrganizationPermissionValue<"labPermission">[],
    }),
    autoAssign: ["owner", "admin"] as const,
  },
  {
    key: "lab_member",
    name: "Lab Member",
    description: "Participate in lab workflows with standard access.",
    permissions: definePermissions({
      lab: ["read"] as OrganizationPermissionValue<"lab">[],
    }),
    autoAssign: ["member"] as const,
  },
  {
    key: "lab_technician",
    name: "Lab Technician",
    description: "Handle onboarding and technical operations for the LIS.",
    permissions: definePermissions({
      lab: [
        "read",
        "managePermissions",
      ] as OrganizationPermissionValue<"lab">[],
    }),
    autoAssign: [] as const,
  },
  {
    key: "clinical_laboratory_scientist",
    name: "Clinical Laboratory Scientist",
    description: "Manage and review clinical laboratory workflows.",
    permissions: definePermissions({
      lab: ["read"] as OrganizationPermissionValue<"lab">[],
    }),
    autoAssign: [] as const,
  },
  {
    key: "doctor",
    name: "Doctor",
    description: "Access lab results and patient facing data.",
    permissions: definePermissions({
      lab: ["read"] as OrganizationPermissionValue<"lab">[],
    }),
    autoAssign: [] as const,
  },
  {
    key: "receptionist",
    name: "Receptionist",
    description: "Handle scheduling, intake, and patient communications.",
    permissions: definePermissions({
      lab: ["read"] as OrganizationPermissionValue<"lab">[],
    }),
    autoAssign: [] as const,
  },
] as const;

export type LabRoleDefinition = (typeof LAB_ROLE_DEFINITIONS)[number];

export const LAB_ROLE_DEFINITION_MAP = LAB_ROLE_DEFINITIONS.reduce<
  Record<string, LabRoleDefinition>
>((acc, def) => {
  acc[def.key] = def;
  return acc;
}, {});

const ORGANIZATION_PERMISSION_LOOKUP = new Map<
  OrganizationPermissionKey,
  Set<string>
>(
  Object.entries(ORGANIZATION_PERMISSION_STATEMENT).map(([resource, actions]) => [
    resource as OrganizationPermissionKey,
    new Set(actions),
  ]),
);

export function validatePermissionDefinition(
  definition: PermissionDefinition,
): void {
  for (const [resource, actions] of Object.entries(definition)) {
    const allowed = ORGANIZATION_PERMISSION_LOOKUP.get(
      resource as OrganizationPermissionKey,
    );
    if (!allowed) {
      throw new Error(`Unknown resource "${resource}" in permission set.`);
    }
    for (const action of actions as string[]) {
      if (!allowed.has(action)) {
        throw new Error(
          `Action "${action}" is not permitted for resource "${resource}".`,
        );
      }
    }
  }
}

export function normalizePermissionDefinition(
  definition: RolePermissionMap,
): OrganizationRoleConfig {
  const normalizedEntries: Partial<
    Record<
      OrganizationPermissionKey,
      OrganizationPermissionValue<OrganizationPermissionKey>[]
    >
  > = {};

  for (const resource of Object.keys(ORGANIZATION_PERMISSION_STATEMENT) as OrganizationPermissionKey[]) {
    const actions = definition[resource];
    if (!actions) continue;
    const allowed = ORGANIZATION_PERMISSION_LOOKUP.get(resource);
    if (!allowed) continue;

    const uniqueActions = Array.from(new Set(actions));
    if (uniqueActions.length === 0) continue;

    const typedActions = uniqueActions.map((action) => {
      if (!allowed.has(action)) {
        throw new Error(
          `Action "${action}" is not permitted for resource "${resource}".`,
        );
      }
      return action as OrganizationPermissionValue<typeof resource>;
    });

    normalizedEntries[resource] = typedActions;
  }

  return normalizedEntries as OrganizationRoleConfig;
}
