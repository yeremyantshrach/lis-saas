import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";
import { stripe as stripePlugin } from "@better-auth/stripe";
import Stripe from "stripe";

import { db, schema } from "./database";
import { env } from "./env";

const stripeClient = new Stripe(env.stripe.secretKey, {
  apiVersion: "2025-09-30.clover",
});

export const auth = betterAuth({
  baseURL: env.betterAuth.baseURL,
  secret: env.betterAuth.secret,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [
    admin(),
    organization(),
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
