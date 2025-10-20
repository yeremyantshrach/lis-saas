import {
  boolean,
  jsonb,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { member, organization, user } from "./auth-schema";
import type { RolePermissionMap } from "./permissions";

const createAppTable = pgTableCreator((name) => name);

export const lab = createAppTable(
  "lab",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: text("team_id").notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdByMemberId: uuid("created_by_member_id").references(() => member.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("lab_org_slug_idx").on(table.organizationId, table.slug),
    uniqueIndex("lab_team_id_idx").on(table.teamId),
  ],
);

export const labRole = createAppTable(
  "lab_role",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    labId: uuid("lab_id")
      .notNull()
      .references(() => lab.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    permissions: jsonb("permissions").$type<RolePermissionMap>().notNull(),
    isSystem: boolean("is_system").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdByMemberId: uuid("created_by_member_id").references(() => member.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("lab_role_lab_key_idx").on(table.labId, table.key)],
);

export const labMember = createAppTable(
  "lab_member",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    labId: uuid("lab_id")
      .notNull()
      .references(() => lab.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationMemberId: uuid("organization_member_id").references(
      () => member.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    addedByMemberId: uuid("added_by_member_id").references(() => member.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    uniqueIndex("lab_member_unique_idx").on(
      table.labId,
      table.userId,
    ),
  ],
);

export const labMemberRole = createAppTable(
  "lab_member_role",
  {
    labMemberId: uuid("lab_member_id")
      .notNull()
      .references(() => labMember.id, { onDelete: "cascade" }),
    labRoleId: uuid("lab_role_id")
      .notNull()
      .references(() => labRole.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    assignedByMemberId: uuid("assigned_by_member_id").references(
      () => member.id,
      {
        onDelete: "set null",
      },
    ),
  },
  (table) => [
    primaryKey({
      columns: [table.labMemberId, table.labRoleId],
      name: "lab_member_role_pk",
    }),
  ],
);
