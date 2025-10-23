import { betterAuth, APIError, createMiddleware, BetterAuthOptions } from "better-auth";
import { customSession, openAPI } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";
import { stripe as stripePlugin } from "@better-auth/stripe";
import { adminAccessControl, admin as appAdmin, support } from "@/lib/auth/admin-permissions";
import Stripe from "stripe";

import { db, schema } from "./database";
import { env } from "./env";
import { slugify } from "./utils";
import { organizationAccessControl, organizationRoles } from "@/lib/auth/organization-permissions";

const stripeClient = new Stripe(env.stripe.secretKey, {
  apiVersion: "2025-08-27.basil",
});

const stripe = stripePlugin({
  stripeClient,
  stripeWebhookSecret: env.stripe.webhookSecret,
  createCustomerOnSignUp: true,
});
const options = {
  appName: "LIS",
  baseURL: env.betterAuth.baseURL,
  secret: env.betterAuth.secret,
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    transaction: true,
    debugLogs: {
      create: true,
    },
  }),
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          // Get the user's organization (they can only have one)
          const userOrg = await db.query.member.findFirst({
            where: (member, { eq }) => eq(member.userId, session.userId),
            with: {
              organization: true,
            },
          });

          // Set the active organization if they have one
          if (userOrg?.organization) {
            return {
              data: {
                ...session,
                activeOrganizationId: userOrg.organization.id,
                // Store slug for easy client-side access
                activeOrganizationSlug: userOrg.organization.slug,
              },
            };
          }

          return {
            data: session,
          };
        },
      },
    },
  },
  plugins: [
    nextCookies(),
    admin({
      ac: adminAccessControl,
      roles: {
        admin: appAdmin,
        support,
      },
    }),
    organization({
      organizationHooks: {
        beforeCreateOrganization: async ({ organization }) => {
          if (!organization.name) {
            throw new APIError("BAD_REQUEST", { message: "Organization name is required" });
          }
          return {
            data: {
              ...organization,
            },
          };
        },
      },
      async sendInvitationEmail({ id }) {
        console.log("Send invitation url", `${env.betterAuth.baseURL}/invite/${id}`);
      },
      schema: {
        invitation: {
          fields: {
            teamId: "labId",
          },
        },
        team: {
          modelName: "labs",
        },
        teamMember: {
          modelName: "labTeamMember",
          fields: {
            teamId: "labId",
          },
        },
      },
      allowUserToCreateOrganization: true,
      organizationLimit: 1,
      teams: {
        enabled: true,
        allowRemovingAllTeams: true,
        defaultTeam: {
          enabled: false,
        },
        maximumMembersPerTeam: 10,
      },
      creatorRole: "org-owner",
      ac: organizationAccessControl,
      roles: organizationRoles,
    }),
    openAPI(),
  ],
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
  plugins: [
    ...options.plugins,
    customSession(async ({ session, user }) => {
      const userOrg = await db.query.member.findFirst({
        where: (member, { eq }) => eq(member.userId, session.userId),
        with: {
          organization: true,
        },
      });
      return {
        user,
        session: {
          ...session,
          activeOrganizationId: userOrg?.organization?.id || null,
          activeOrganizationSlug: userOrg?.organization?.slug || null,
        },
      };
    }, options),
  ],
});

export type Auth = typeof auth;
export type AuthSession = typeof auth.$Infer.Session;
export type Organization = typeof auth.$Infer.Organization;
