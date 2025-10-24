import { db } from "@/lib/database";
import { tryCatch } from "@/lib/try-catch";
import { eq, and, inArray } from "drizzle-orm";
import { organization, member, labs, labTeamMember } from "@/lib/schema";

export async function safeGetOrganizationBySlug(slug: string) {
  return tryCatch(
    db.query.organization.findFirst({
      where: eq(organization.slug, slug),
    }),
  );
}

export async function safeGetOrganizationById(id: string) {
  return tryCatch(
    db.query.organization.findFirst({
      where: eq(organization.id, id),
    }),
  );
}

export async function safeGetUserOrganization(userId: string) {
  return tryCatch(
    db.query.member.findFirst({
      where: eq(member.userId, userId),
      with: {
        organization: {
          with: {
            members: {
              with: {
                user: true,
              },
            },
          },
        },
      },
    }),
  );
}

export async function safeGetUserMember(userId: string, organizationId: string) {
  return tryCatch(
    db.query.member.findFirst({
      where: (member, { and, eq }) =>
        and(eq(member.userId, userId), eq(member.organizationId, organizationId)),
    }),
  );
}

export async function safeGetInvitation(invitationId: string) {
  return tryCatch(
    db.query.invitation.findFirst({
      where: (invitation, { eq }) => eq(invitation.id, invitationId),
    }),
  );
}

export async function safeGetLabTeamMemberships(organizationId: string, labIds: string[]) {
  return tryCatch(
    db
      .select({
        userId: labTeamMember.userId,
        labId: labTeamMember.labId,
        labName: labs.name,
      })
      .from(labTeamMember)
      .innerJoin(labs, eq(labs.id, labTeamMember.labId))
      .where(and(eq(labs.organizationId, organizationId), inArray(labTeamMember.labId, labIds))),
  );
}

export async function safeFindPendingInvitations(organizationId: string) {
  return tryCatch(
    db.query.invitation.findMany({
      where: (invitation, { and, eq }) =>
        and(eq(invitation.organizationId, organizationId), eq(invitation.status, "pending")),
      with: {
        lab: true,
      },
      orderBy: (invitation, { desc }) => [desc(invitation.createdAt)],
    }),
  );
}
