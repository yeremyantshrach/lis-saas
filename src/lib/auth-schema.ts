import { pgTable, uniqueIndex, pgEnum, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";

export const organizationRoleEnum = pgEnum("organization_role_enum", [
  "org-owner",
  "lab-admin",
  "lab-cls",
  "lab-tech",
  "lab-doc",
  "lab-receptionist",
]);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey().notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: "string" }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: "string" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [uniqueIndex("account_pkey").on(table.id)],
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    email: text("email").notNull(),
    role: text("role"),
    labId: text("lab_id"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    inviterId: text("inviter_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("invitation_pkey").on(table.id)],
);

export const labTeamMember = pgTable(
  "lab_team_member",
  {
    id: text("id").primaryKey().notNull(),
    labId: text("lab_id").notNull(),
    userId: text("user_id").notNull(),
    teamId: text("team_id").notNull(),
    role: organizationRoleEnum("role").default("lab-receptionist").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("lab_team_member_pkey").on(table.id)],
);

export const labs = pgTable(
  "labs",
  {
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull(),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }),
  },
  (table) => [uniqueIndex("labs_pkey").on(table.id)],
);

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    role: organizationRoleEnum("role").default("org-owner").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("member_pkey").on(table.id)],
);

export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    logo: text("logo"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    metadata: text("metadata"),
  },
  (table) => [
    uniqueIndex("organization_pkey").on(table.id),
    uniqueIndex("organization_slug_unique").on(table.slug),
  ],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey().notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull(),
    impersonatedBy: text("impersonated_by"),
    activeOrganizationId: text("active_organization_id"),
    activeTeamId: text("active_team_id"),
  },
  (table) => [
    uniqueIndex("session_pkey").on(table.id),
    uniqueIndex("session_token_unique").on(table.token),
  ],
);

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
    role: text("role"),
    banned: boolean("banned").default(false),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires", { mode: "string" }),
  },
  (table) => [
    uniqueIndex("user_email_unique").on(table.email),
    uniqueIndex("user_pkey").on(table.id),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey().notNull(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("verification_pkey").on(table.id)],
);
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
