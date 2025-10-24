import { betterAuth, APIError, BetterAuthOptions } from "better-auth";
import { customSession, openAPI } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";
import { stripe as stripePlugin } from "@better-auth/stripe";
import { adminAccessControl, admin as appAdmin, support } from "@/lib/auth/admin-permissions";
import Stripe from "stripe";

import { db, schema } from "./database";
import { env } from "./env";
import { organizationAccessControl, organizationRoles } from "@/lib/auth/organization-permissions";
import { tryCatch } from "./try-catch";
import { sendEmail } from "@/lib/emails/send-email";
import { VerificationEmail } from "@/lib/emails/templates/verification-email";
import { ResetPasswordEmail } from "@/lib/emails/templates/reset-password-email";
import { InvitationEmail } from "@/lib/emails/templates/invitation-email";

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
  emailVerification: {
    sendOnSignUp: false,
    sendOnSignIn: false,
    sendVerificationEmail: async ({ user, url, token }) => {
      const verificationUrl = url ?? `${env.betterAuth.baseURL}/verify-email?token=${token ?? ""}`;
      try {
        await sendEmail({
          to: user.email,
          subject: "Verify your LIS email address",
          react: VerificationEmail({
            userName: user.name,
            verificationUrl,
            token: token ?? "",
          }),
        });
      } catch (error) {
        console.error("Failed to send verification email", error);
      }
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    sendResetPassword: async ({ user, url, token }) => {
      const resetUrl = url ?? `${env.betterAuth.baseURL}/reset-password?token=${token ?? ""}`;
      const expiresInMinutes = 60;

      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your LIS password",
          react: ResetPasswordEmail({
            userName: user.name,
            resetUrl,
            expiresInMinutes,
          }),
        });
      } catch (error) {
        console.error("Failed to send reset password email", error);
      }
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const [results, error] = await tryCatch(
            Promise.all([
              db.query.member.findFirst({
                where: (member, { eq }) => eq(member.userId, session.userId),
                with: { organization: true },
              }),
              db.query.labTeamMember.findFirst({
                where: (labTeamMember, { eq }) => eq(labTeamMember.userId, session.userId),
              }),
            ]),
          );

          const [userOrg, userTeam] = error ? [null, null] : results;

          return {
            data: {
              ...session,
              activeOrganizationId: userOrg?.organization?.id || null,
              activeOrganizationSlug: userOrg?.organization?.slug || null,
              activeLabId: userTeam?.labId || null,
            },
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
      requireEmailVerificationOnInvitation: true,
      cancelPendingInvitationsOnReInvite: true,
      sendInvitationEmail: async ({ id }) => {
        const invitation = await db.query.invitation.findFirst({
          where: (invitation, { eq }) => eq(invitation.id, id),
          with: {
            organization: true,
            lab: true,
            user: true,
          },
        });

        if (!invitation) {
          console.warn("Invitation not found for email send", id);
          return;
        }

        const invitationUrl = `${env.betterAuth.baseURL}/invite/${id}`;
        const organizationName = invitation.organization?.name ?? "your organization";
        const inviterName = invitation.user?.name ?? undefined;

        try {
          await sendEmail({
            to: invitation.email,
            subject: `Invitation to join ${organizationName} on LIS`,
            react: InvitationEmail({
              inviteeEmail: invitation.email,
              inviterName,
              organizationName,
              invitationUrl,
              role: invitation.role,
              labName: invitation.lab?.name ?? null,
            }),
          });
        } catch (error) {
          console.error("Failed to send invitation email", error);
        }
      },
      schema: {
        session: {
          fields: {
            activeTeamId: "activeLabId",
          },
        },
        invitation: {
          fields: {
            teamId: "labId",
          },
          additionalFields: {
            createdAt: {
              type: "date",
              defaultValue: () => new Date(),
              sortable: true,
              input: false,
            },
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
      const [results, error] = await tryCatch(
        Promise.all([
          db.query.member.findFirst({
            where: (member, { eq }) => eq(member.userId, session.userId),
            with: { organization: true },
          }),
          db.query.labTeamMember.findFirst({
            where: (labTeamMember, { eq }) => eq(labTeamMember.userId, session.userId),
            columns: { labId: true },
          }),
        ]),
      );

      const [userOrg, userTeam] = error ? [null, null] : results;

      return {
        user,
        session: {
          ...session,
          activeOrganizationId: userOrg?.organization?.id || null,
          activeOrganizationSlug: userOrg?.organization?.slug || null,
          activeLabId: userTeam?.labId || null,
        },
      };
    }, options),
  ],
});
export type Auth = typeof auth;
export type AuthSession = typeof auth.$Infer.Session;
export type Organization = typeof auth.$Infer.Organization;
export type Invitation = typeof auth.$Infer.Invitation;
