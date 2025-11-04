import { sql, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/database";
import { organization, labs, member, invitation, user, session } from "@/lib/auth/auth-schema";
import { labTests } from "@/lib/lab-tests/schema";
import type { LabTestRlsContext } from "@/lib/helpers/lab-tests-helpers";
import { listAccessiblePcrTests } from "@/lib/helpers/lab-tests-helpers";

export interface OverviewStats {
  organizationCount: number;
  labCount: number;
  userCount: number;
  labTestCount: number;
  activeSessionCount: number;
  pendingInviteCount: number;
}

export async function getAdminOverviewStats(): Promise<OverviewStats> {
  const [orgs, orgLabs, usersResult, testsResult, sessionsResult, invitesResult] =
    await Promise.all([
      db.select({ count: sql<number>`COUNT(*)` }).from(organization),
      db.select({ count: sql<number>`COUNT(*)` }).from(labs),
      db.select({ count: sql<number>`COUNT(*)` }).from(user),
      db.select({ count: sql<number>`COUNT(*)` }).from(labTests),
      db.select({ count: sql<number>`COUNT(*)` }).from(session),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(invitation)
        .where(eq(invitation.status, "pending")),
    ]);

  return {
    organizationCount: orgs[0]?.count ?? 0,
    labCount: orgLabs[0]?.count ?? 0,
    userCount: usersResult[0]?.count ?? 0,
    labTestCount: testsResult[0]?.count ?? 0,
    activeSessionCount: sessionsResult[0]?.count ?? 0,
    pendingInviteCount: invitesResult[0]?.count ?? 0,
  };
}

export async function getRecentOrganizations(limit = 6) {
  return db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.createdAt,
    })
    .from(organization)
    .orderBy(desc(organization.createdAt))
    .limit(limit);
}

export async function getRecentUsers(limit = 6) {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(limit);
}

export async function getRecentPendingInvitations(limit = 6) {
  return db
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      organizationId: invitation.organizationId,
      labId: invitation.labId,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    })
    .from(invitation)
    .where(eq(invitation.status, "pending"))
    .orderBy(desc(invitation.createdAt))
    .limit(limit);
}

export interface OrganizationWithStats {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  labCount: number;
  memberCount: number;
  pendingInviteCount: number;
}

export async function getOrganizationsWithStats(): Promise<OrganizationWithStats[]> {
  return db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.createdAt,
      labCount: sql<number>`count(DISTINCT ${labs.id})`,
      memberCount: sql<number>`count(DISTINCT ${member.id})`,
      pendingInviteCount: sql<number>`count(DISTINCT ${invitation.id}) FILTER (WHERE ${invitation.status} = 'pending')`,
    })
    .from(organization)
    .leftJoin(labs, eq(labs.organizationId, organization.id))
    .leftJoin(member, eq(member.organizationId, organization.id))
    .leftJoin(invitation, eq(invitation.organizationId, organization.id))
    .groupBy(organization.id, organization.name, organization.slug, organization.createdAt)
    .orderBy(desc(organization.createdAt));
}

export async function getAllUsers() {
  return db.query.user.findMany({
    orderBy: (table, { desc: orderDesc }) => orderDesc(table.createdAt),
    with: {
      members: {
        columns: {
          role: true,
          organizationId: true,
        },
        with: {
          organization: {
            columns: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });
}

export async function getLabsWithOrganizations() {
  return db
    .select({
      id: labs.id,
      name: labs.name,
      organizationId: labs.organizationId,
      organizationName: organization.name,
      organizationSlug: organization.slug,
      createdAt: labs.createdAt,
    })
    .from(labs)
    .innerJoin(organization, eq(organization.id, labs.organizationId))
    .orderBy(desc(labs.createdAt));
}

export async function listAllPcrTestsForAdmin(
  context: Omit<LabTestRlsContext, "organizationId" | "labId">,
) {
  const tests = await listAccessiblePcrTests({
    ...context,
    organizationId: null,
    labId: null,
  });

  if (!tests.length) {
    return [];
  }

  const labIds = [...new Set(tests.map((test) => test.labId))];
  const relatedLabs = await db
    .select({
      id: labs.id,
      name: labs.name,
      organizationId: labs.organizationId,
      organizationName: organization.name,
      organizationSlug: organization.slug,
    })
    .from(labs)
    .innerJoin(organization, eq(organization.id, labs.organizationId))
    .where(inArray(labs.id, labIds));

  const labsById = new Map<string, (typeof relatedLabs)[number]>();
  relatedLabs.forEach((lab) => labsById.set(lab.id, lab));

  return tests.map((test) => {
    const labRecord = labsById.get(test.labId);
    return {
      ...test,
      labName: labRecord?.name ?? "Unknown Lab",
      organizationId: labRecord?.organizationId ?? null,
      organizationName: labRecord?.organizationName ?? null,
      organizationSlug: labRecord?.organizationSlug ?? null,
    };
  });
}

export async function getOrganizationDetailBySlug(slug: string) {
  const record = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
    with: {
      labs: true,
      members: {
        with: {
          user: true,
        },
      },
      invitations: true,
    },
  });

  if (!record) {
    return null;
  }

  const labIds = record.labs.map((lab) => lab.id);

  const pendingInvites = record.invitations.filter((invite) => invite.status === "pending");

  return {
    organization: record,
    labs: record.labs,
    members: record.members,
    pendingInvitations: pendingInvites,
    labIds,
  };
}
