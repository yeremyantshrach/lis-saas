import { betterAuth, APIError, createMiddleware } from "better-auth";
import { customSession } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";
import { stripe as stripePlugin } from "@better-auth/stripe";
import { adminAccessControl, admin as appAdmin, support } from "@/lib/auth/admin-permissions";
import Stripe from "stripe";

import { db, schema } from "./database";
import { env } from "./env";
import { slugify } from "./utils";
import {
  organizationAccessControl,
  orgOwner,
  labCls,
  labAdmin,
  labDoctor,
  labTech,
  labReceptionist,
} from "@/lib/auth/organization-permissions";

const stripeClient = new Stripe(env.stripe.secretKey, {
  apiVersion: "2025-08-27.basil",
});

const stripe = stripePlugin({
  stripeClient,
  stripeWebhookSecret: env.stripe.webhookSecret,
  createCustomerOnSignUp: true,
});

export const auth = betterAuth({
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
    }),
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
        afterCreateOrganization: async ({ organization }) => {},
      },
      schema: {
        invitation: {
          additionalFields: {
            labId: {
              type: "string",
              nullable: true,
              references: { model: "labs", field: "id" },
            },
          },
        },
        team: {
          modelName: "labs",
        },
        teamMember: {
          modelName: "labTeamMember",
        },
      },
      allowUserToCreateOrganization: true,
      organizationLimit: 1,
      teams: {
        enabled: true,
        defaultTeam: {
          enabled: false,
        },
        maximumMembersPerTeam: 10,
      },
      creatorRole: "org-owner",
      ac: organizationAccessControl,
      roles: {
        orgOwner,
        labCls,
        labAdmin,
        labDoctor,
        labTech,
        labReceptionist,
      },
    }),
  ],
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
});

export type Auth = typeof auth;
