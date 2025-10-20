import { and, eq, inArray, ne } from "drizzle-orm";
import {
  lab,
  labMember,
  labMemberRole,
  labRole,
} from "./app-schema";
import { member } from "./auth-schema";
import { db } from "./database";
import {
  type AutoAssignGroup,
  LAB_ROLE_DEFINITION_MAP,
  LAB_ROLE_DEFINITIONS,
  organizationAccessControl,
  type LabRoleDefinition,
  type RolePermissionMap,
  normalizePermissionDefinition,
  validatePermissionDefinition,
} from "./permissions";
import { slugify } from "./utils";

export type OrganizationSnapshot = {
  id: string;
  name?: string | null;
  slug?: string | null;
};

export type TeamSnapshot = {
  id: string;
  name: string;
  organizationId: string;
  createdAt?: Date;
  updatedAt?: Date | null;
};

export type TeamMemberSnapshot = {
  id: string;
  teamId: string;
  userId: string;
};

type CreateLabRoleInput = {
  labId: string;
  key?: string | null;
  name: string;
  description?: string | null;
  permissions: RolePermissionMap;
  createdByMemberId?: string | null;
  isSystem?: boolean;
};

type EnsureLabMembershipInput = {
  labId: string;
  userId: string;
  organizationMemberId?: string | null;
  addedByMemberId?: string | null;
};

type AssignLabRolesInput = {
  labId: string;
  userId: string;
  organizationMemberId?: string | null;
  roleKeys: string[];
  assignedByMemberId?: string | null;
};

type SyncLabFromTeamInput = {
  team: TeamSnapshot;
  organization: OrganizationSnapshot;
  creatorUserId?: string | null;
  isDefault?: boolean;
};

type TeamMemberEventInput = {
  team: TeamSnapshot;
  organization: OrganizationSnapshot;
  teamMember: TeamMemberSnapshot;
};

const AUTO_ASSIGN_GROUPS: readonly AutoAssignGroup[] = [
  "owner",
  "admin",
  "member",
] as const;

const AUTO_ASSIGN_GROUP_SET = new Set<AutoAssignGroup>(AUTO_ASSIGN_GROUPS);

function isAutoAssignGroup(value: string): value is AutoAssignGroup {
  return AUTO_ASSIGN_GROUP_SET.has(value as AutoAssignGroup);
}

function toMetadata(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

async function findOrganizationMember(
  organizationId: string,
  userId: string,
) {
  const [orgMember] = await db
    .select({
      id: member.id,
      role: member.role,
    })
    .from(member)
    .where(and(eq(member.organizationId, organizationId), eq(member.userId, userId)))
    .limit(1);

  return orgMember ?? null;
}

async function ensureUniqueLabSlug(
  organizationId: string,
  baseSlug: string,
  currentLabId?: string,
): Promise<string> {
  let slugCandidate = slugify(baseSlug);
  if (!slugCandidate) {
    slugCandidate = crypto.randomUUID();
  }

  let suffix = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const predicates = [
      eq(lab.organizationId, organizationId),
      eq(lab.slug, slugCandidate),
    ] as const;

    const whereClause = currentLabId
      ? and(...predicates, ne(lab.id, currentLabId))
      : and(...predicates);

    const [existing] = await db
      .select({ id: lab.id })
      .from(lab)
      .where(whereClause)
      .limit(1);

    if (!existing) {
      return slugCandidate;
    }

    suffix += 1;
    slugCandidate = `${slugify(baseSlug)}-${suffix}`;
  }
}

function ensureRolePermissions(
  permissions: RolePermissionMap,
): RolePermissionMap {
  validatePermissionDefinition(permissions);
  const normalized = normalizePermissionDefinition(permissions);
  organizationAccessControl.newRole(normalized);

  const entries = Object.entries(normalized).map(
    ([resource, actions]) => [resource, [...actions]] as const,
  );

  return Object.fromEntries(entries) as RolePermissionMap;
}

export async function syncLabFromTeam({
  team,
  organization,
  creatorUserId,
  isDefault,
}: SyncLabFromTeamInput): Promise<string> {
  const [existing] = await db
    .select({
      id: lab.id,
      isDefault: lab.isDefault,
      metadata: lab.metadata,
      createdAt: lab.createdAt,
      createdByMemberId: lab.createdByMemberId,
    })
    .from(lab)
    .where(eq(lab.teamId, team.id))
    .limit(1);

  const metadata = {
    ...toMetadata(existing?.metadata),
    teamId: team.id,
    teamName: team.name,
    organizationSlug: organization.slug ?? null,
  } satisfies Record<string, unknown>;

  let createdByMemberId = existing?.createdByMemberId ?? null;

  if (!existing && creatorUserId) {
    const orgMember = await findOrganizationMember(organization.id, creatorUserId);
    if (orgMember) {
      createdByMemberId = orgMember.id;
    }
  }

  let resolvedIsDefault = existing?.isDefault ?? false;

  if (typeof isDefault === "boolean") {
    resolvedIsDefault = isDefault;
  } else if (!existing) {
    const [defaultLab] = await db
      .select({ id: lab.id })
      .from(lab)
      .where(and(eq(lab.organizationId, organization.id), eq(lab.isDefault, true)))
      .limit(1);

    resolvedIsDefault = !defaultLab;
  }

  const slug = await ensureUniqueLabSlug(
    organization.id,
    team.name,
    existing?.id,
  );

  const createdAt = existing?.createdAt ?? team.createdAt ?? new Date();

  const values = {
    teamId: team.id,
    organizationId: organization.id,
    name: team.name,
    slug,
    description: null,
    metadata,
    isDefault: resolvedIsDefault,
    createdAt,
    createdByMemberId,
  };

  const [upserted] = await db
    .insert(lab)
    .values(values)
    .onConflictDoUpdate({
      target: lab.teamId,
      set: {
        name: team.name,
        slug,
        metadata,
        organizationId: organization.id,
        isDefault: resolvedIsDefault,
        updatedAt: new Date(),
      },
    })
    .returning({ id: lab.id, createdByMemberId: lab.createdByMemberId });

  const labId = upserted.id;

  if (!existing) {
    await seedSystemLabRoles(labId, upserted.createdByMemberId ?? createdByMemberId);
  }

  return labId;
}

export async function deleteLabForTeam(teamId: string) {
  await db.delete(lab).where(eq(lab.teamId, teamId));
}

export async function createLabRoleRecord(input: CreateLabRoleInput) {
  const permissions = ensureRolePermissions(input.permissions);

  const generatedKey = slugify(input.name) || crypto.randomUUID();
  await db
    .insert(labRole)
    .values({
      labId: input.labId,
      key: input.key ?? generatedKey,
      name: input.name,
      description: input.description ?? null,
      permissions,
      isSystem: Boolean(input.isSystem),
      createdByMemberId: input.createdByMemberId ?? null,
    })
    .onConflictDoUpdate({
      target: [labRole.labId, labRole.key],
      set: {
        name: input.name,
        description: input.description ?? null,
        permissions,
        isSystem: Boolean(input.isSystem),
      },
    });
}

export async function ensureLabMembership(
  input: EnsureLabMembershipInput,
) {
  const [existing] = await db
    .select({ id: labMember.id })
    .from(labMember)
    .where(
      and(
        eq(labMember.labId, input.labId),
        eq(labMember.userId, input.userId),
      ),
    )
    .limit(1);

  if (existing) {
    return existing.id;
  }

  const membershipId = crypto.randomUUID();

  const [created] = await db
    .insert(labMember)
    .values({
      id: membershipId,
      labId: input.labId,
      userId: input.userId,
      organizationMemberId: input.organizationMemberId ?? null,
      addedByMemberId: input.addedByMemberId ?? null,
    })
    .returning({ id: labMember.id });

  return created.id;
}

export async function removeLabMembership(input: EnsureLabMembershipInput) {
  const [existing] = await db
    .select({ id: labMember.id })
    .from(labMember)
    .where(
      and(
        eq(labMember.labId, input.labId),
        eq(labMember.userId, input.userId),
      ),
    )
    .limit(1);

  if (!existing) {
    return false;
  }

  await db.delete(labMember).where(eq(labMember.id, existing.id));
  return true;
}

export async function assignLabRoles(input: AssignLabRolesInput) {
  const labMemberId = await ensureLabMembership({
    labId: input.labId,
    userId: input.userId,
    organizationMemberId: input.organizationMemberId ?? null,
    addedByMemberId: input.assignedByMemberId ?? null,
  });

  if (!input.roleKeys.length) {
    return;
  }

  const roles = await db
    .select({ id: labRole.id, key: labRole.key })
    .from(labRole)
    .where(
      and(eq(labRole.labId, input.labId), inArray(labRole.key, input.roleKeys)),
    );

  if (!roles.length) {
    return;
  }

  await db
    .insert(labMemberRole)
    .values(
      roles.map((role) => ({
        labMemberId,
        labRoleId: role.id,
        assignedByMemberId: input.assignedByMemberId ?? null,
      })),
    )
    .onConflictDoNothing({
      target: [labMemberRole.labMemberId, labMemberRole.labRoleId],
    });
}

export async function seedSystemLabRoles(
  labId: string,
  createdByMemberId: string | null,
) {
  for (const definition of LAB_ROLE_DEFINITIONS) {
    await createLabRoleRecord({
      labId,
      key: definition.key,
      name: definition.name,
      description: definition.description,
      permissions: definition.permissions,
      createdByMemberId,
      isSystem: true,
    });
  }
}

export async function autoAssignSystemRolesForMember(options: {
  labId: string;
  userId: string;
  organizationMemberId?: string | null;
  organizationRole: AutoAssignGroup | string;
  assignedByMemberId?: string | null;
}) {
  const baseMembership: EnsureLabMembershipInput = {
    labId: options.labId,
    userId: options.userId,
    organizationMemberId: options.organizationMemberId ?? null,
    addedByMemberId: options.assignedByMemberId ?? null,
  };

  if (!isAutoAssignGroup(options.organizationRole)) {
    await ensureLabMembership(baseMembership);
    return;
  }

  const normalizedRole = options.organizationRole as AutoAssignGroup;

  const roleKeys = LAB_ROLE_DEFINITIONS.filter((definition) =>
    definition.autoAssign.includes(normalizedRole),
  ).map((definition) => definition.key);

  if (!roleKeys.length) {
    await ensureLabMembership(baseMembership);
    return;
  }

  await assignLabRoles({
    labId: options.labId,
    userId: options.userId,
    organizationMemberId: options.organizationMemberId ?? null,
    roleKeys,
    assignedByMemberId: options.assignedByMemberId ?? null,
  });
}

export async function handleTeamMemberAdded({
  team,
  organization,
  teamMember,
}: TeamMemberEventInput) {
  const [labRecord] = await db
    .select({ id: lab.id })
    .from(lab)
    .where(eq(lab.teamId, team.id))
    .limit(1);

  if (!labRecord) {
    return;
  }

  const orgMember = await findOrganizationMember(
    organization.id,
    teamMember.userId,
  );

  if (!orgMember) {
    await ensureLabMembership({
      labId: labRecord.id,
      userId: teamMember.userId,
      organizationMemberId: null,
      addedByMemberId: null,
    });
    return;
  }

  await autoAssignSystemRolesForMember({
    labId: labRecord.id,
    userId: teamMember.userId,
    organizationMemberId: orgMember.id,
    organizationRole: orgMember.role,
    assignedByMemberId: orgMember.id,
  });
}

export async function handleTeamMemberRemoved({
  team,
  organization,
  teamMember,
}: TeamMemberEventInput) {
  const [labRecord] = await db
    .select({ id: lab.id })
    .from(lab)
    .where(eq(lab.teamId, team.id))
    .limit(1);

  if (!labRecord) {
    return;
  }

  const orgMember = await findOrganizationMember(
    organization.id,
    teamMember.userId,
  );

  await removeLabMembership({
    labId: labRecord.id,
    userId: teamMember.userId,
    organizationMemberId: orgMember?.id ?? null,
  });
}

export async function ensureDefaultLabMembership(options: {
  organizationId: string;
  organizationMemberId: string;
  userId: string;
  organizationRole: AutoAssignGroup | string;
}) {
  const [defaultLab] = await db
    .select({ id: lab.id })
    .from(lab)
    .where(and(eq(lab.organizationId, options.organizationId), eq(lab.isDefault, true)))
    .limit(1);

  if (!defaultLab) {
    return null;
  }

  await autoAssignSystemRolesForMember({
    labId: defaultLab.id,
    userId: options.userId,
    organizationMemberId: options.organizationMemberId,
    organizationRole: options.organizationRole,
    assignedByMemberId: options.organizationMemberId,
  });

  return defaultLab.id;
}

export async function createCustomLabRole(input: CreateLabRoleInput) {
  if (!input.key) {
    throw new Error("Custom lab roles must specify a stable `key` value.");
  }

  const normalizedKey = slugify(input.key);
  if (!normalizedKey) {
    throw new Error(
      "Custom lab role key must include alphanumeric characters.",
    );
  }

  if (LAB_ROLE_DEFINITION_MAP[normalizedKey]) {
    throw new Error(
      `Role key "${input.key}" is reserved for system lab roles.`,
    );
  }

  await createLabRoleRecord({
    ...input,
    key: normalizedKey,
    isSystem: false,
  });
}

export function mapDefinitionToPermissionPayload(
  definition: LabRoleDefinition,
): RolePermissionMap {
  return ensureRolePermissions(definition.permissions);
}
