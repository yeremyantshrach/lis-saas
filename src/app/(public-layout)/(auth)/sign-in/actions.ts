"use server";

import { signinSchema, type SigninFormData } from "@/lib/validations/auth";
import { APIError } from "better-auth/api";
import { ZodError, z } from "zod";
import { getUserOrganization } from "@/server/get-user-organization";
import { safeSignInEmail, safeListUserInvitations } from "@/lib/helpers/auth-helpers";
import {
  createSuccessResult,
  createErrorResult,
  type ActionResult,
} from "@/lib/helpers/action-helpers";

export async function signinAction(data: SigninFormData): Promise<ActionResult> {
  try {
    const validatedData = signinSchema.parse(data);

    const [result, authError] = await safeSignInEmail(validatedData.email, validatedData.password);
    if (authError) {
      if (authError instanceof APIError) {
        const message = authError.body?.message ?? authError.message ?? "Unknown error";
        const verificationUrl = `/verify-email?email=${encodeURIComponent(validatedData.email)}`;

        if (authError.body?.code === "EMAIL_NOT_VERIFIED") {
          return createErrorResult(message, undefined, verificationUrl);
        }

        return createErrorResult(message);
      }

      return createErrorResult("Invalid email or password");
    }

    const [userInvitations, invitationsError] = await safeListUserInvitations(result.user.email);
    if (invitationsError) {
      console.error("Failed to load user invitations on sign in", invitationsError);
    }

    const now = Date.now();
    const getTime = (value: unknown) => {
      if (!value) return 0;
      if (value instanceof Date) {
        return value.getTime();
      }
      const parsed = new Date(value as string | number);
      return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
    };

    const activeInvitation = userInvitations
      ?.filter((invitation) => invitation.status === "pending")
      .filter((invitation) => {
        const expiresAt = getTime(invitation.expiresAt);
        return expiresAt === 0 || expiresAt > now;
      })
      .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt))
      .at(0);

    if (activeInvitation) {
      const invitationRedirect = `/invite/${encodeURIComponent(activeInvitation.id)}`;
      return createSuccessResult(result, "Signed in successfully!", invitationRedirect);
    }

    const userOrg = await getUserOrganization(result.user.id);
    const redirectUrl = userOrg ? `/${userOrg.slug}/dashboard` : "/onboarding";

    return createSuccessResult(result, "Signed in successfully!", redirectUrl);
  } catch (error) {
    console.dir(error);
    if (error instanceof ZodError) {
      return createErrorResult(
        "Validation failed",
        z.flattenError(error).fieldErrors as Record<string, string[]>,
      );
    }
    return createErrorResult(
      error instanceof Error ? error.message : "An unexpected error occurred",
    );
  }
}
