import { relations } from "drizzle-orm";
import {
  account,
  user,
  invitation,
  labTeamMember,
  member,
  session,
  labs,
  organization,
} from "@/lib/auth/auth-schema";

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  invitations: many(invitation),
  labTeamMembers: many(labTeamMember),
  members: many(member),
  sessions: many(session),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
  lab: one(labs, {
    fields: [invitation.labId],
    references: [labs.id],
  }),
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
}));

export const labsRelations = relations(labs, ({ one, many }) => ({
  invitations: many(invitation),
  labTeamMembers: many(labTeamMember),
  organization: one(organization, {
    fields: [labs.organizationId],
    references: [organization.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  invitations: many(invitation),
  labs: many(labs),
  members: many(member),
}));

export const labTeamMemberRelations = relations(labTeamMember, ({ one }) => ({
  lab: one(labs, {
    fields: [labTeamMember.labId],
    references: [labs.id],
  }),
  user: one(user, {
    fields: [labTeamMember.userId],
    references: [user.id],
  }),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));
