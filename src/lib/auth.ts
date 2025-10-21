import { betterAuth, APIError } from "better-auth";
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
  baseURL: env.betterAuth.baseURL,
  secret: env.betterAuth.secret,
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    transaction: true,
  }),
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
              slug: slugify(organization.name),
            },
          };
        },
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
          modelName: "lab_team_member",
        },
      },
      allowUserToCreateOrganization: true,
      organizationLimit: 1,
      teams: {
        enabled: true,
        maximumMembersPerTeam: 10,
      },
      creatorRole: "orgOwner",
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
