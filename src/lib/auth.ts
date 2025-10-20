import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";
import type { OrganizationOptions } from "better-auth/plugins/organization";
import { stripe as stripePlugin } from "@better-auth/stripe";
import Stripe from "stripe";

import { db, schema } from "./database";
import { env } from "./env";
import {
  appAccessControl,
  appAdminRole,
  organizationAccessControl,
  organizationAdminRole,
  organizationMemberRole,
  organizationOwnerRole,
  supportRole,
} from "./permissions";
import {
  deleteLabForTeam,
  ensureDefaultLabMembership,
  handleTeamMemberAdded,
  handleTeamMemberRemoved,
  syncLabFromTeam,
  type OrganizationSnapshot,
  type TeamMemberSnapshot,
  type TeamSnapshot,
} from "./rbac";
import { slugify } from "./utils";

type OrganizationHooks = NonNullable<OrganizationOptions["organizationHooks"]>;
type AfterAddMemberPayload = Parameters<
  NonNullable<OrganizationHooks["afterAddMember"]>
>[0];
type AfterUpdateMemberRolePayload = Parameters<
  NonNullable<OrganizationHooks["afterUpdateMemberRole"]>
>[0];

type TeamHookContext = {
  team: TeamSnapshot;
  organization: OrganizationSnapshot;
  user?: { id: string } | null;
};

type TeamMemberHookContext = {
  team: TeamSnapshot;
  organization: OrganizationSnapshot;
  teamMember: TeamMemberSnapshot;
  user?: { id: string } | null;
};

const stripeClient = new Stripe(env.stripe.secretKey, {
  apiVersion: "2025-08-27.basil",
});

export const auth = betterAuth({
  baseURL: env.betterAuth.baseURL,
  secret: env.betterAuth.secret,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [
    admin({
      ac: appAccessControl,
      roles: {
        admin: appAdminRole,
        support: supportRole,
      },
    }),
    organization({
      ac: organizationAccessControl,
      roles: {
        owner: organizationOwnerRole,
        admin: organizationAdminRole,
        member: organizationMemberRole,
      },
      teams: {
        enabled: true,
        defaultTeam: {
          enabled: true,
        },
      },
      schema: {
        session: {
          fields: {
            activeTeamId: "active_lab_id",
          },
        },
        team: {
          modelName: "lab",
          fields: {
            organizationId: "organization_id",
            createdAt: "created_at",
            updatedAt: "updated_at",
          },
        },
        teamMember: {
          modelName: "lab_member",
          fields: {
            teamId: "lab_id",
            userId: "user_id",
            createdAt: "created_at",
          },
        },
        invitation: {
          fields: {
            teamId: "lab_id",
          },
        },
      },
      allowUserToCreateOrganization: async () => true,
      organizationHooks: {
        beforeCreateOrganization: async ({ organization, user }) => {
          const proposedName =
            organization.name || user.name || user.email?.split("@")[0];
          const proposedSlug =
            organization.slug || (proposedName ? slugify(proposedName) : null);

          return {
            data: {
              ...organization,
              name: proposedName ?? organization.name,
              slug: proposedSlug ?? organization.slug ?? crypto.randomUUID(),
            },
          };
        },
        afterAddMember: async ({
          member,
          organization,
        }: AfterAddMemberPayload) => {
          await ensureDefaultLabMembership({
            organizationId: organization.id,
            organizationMemberId: member.id,
            userId: member.userId,
            organizationRole: member.role,
          });
        },
        afterUpdateMemberRole: async ({
          member,
          organization,
        }: AfterUpdateMemberRolePayload) => {
          await ensureDefaultLabMembership({
            organizationId: organization.id,
            organizationMemberId: member.id,
            userId: member.userId,
            organizationRole: member.role,
          });
        },
      },
      teamHooks: {
        afterCreateTeam: async ({
          team,
          organization,
          user,
        }: TeamHookContext) => {
          await syncLabFromTeam({
            team,
            organization,
            creatorUserId: user?.id ?? null,
            isDefault: user == null,
          });
        },
        afterDeleteTeam: async ({ team }: TeamHookContext) => {
          await deleteLabForTeam(team.id);
        },
        afterAddTeamMember: async ({
          team,
          organization,
          teamMember,
        }: TeamMemberHookContext) => {
          await handleTeamMemberAdded({
            team,
            organization,
            teamMember,
          });
        },
        afterRemoveTeamMember: async ({
          team,
          organization,
          teamMember,
        }: TeamMemberHookContext) => {
          await handleTeamMemberRemoved({
            team,
            organization,
            teamMember,
          });
        },
      },
    }),
    stripePlugin({
      stripeClient,
      stripeWebhookSecret: env.stripe.webhookSecret,
      createCustomerOnSignUp: true,
    }),
  ],
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
});

export type Auth = typeof auth;
