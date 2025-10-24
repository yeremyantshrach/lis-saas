"use server";

import { signinSchema, type SigninFormData } from "@/lib/validations/auth";
import { APIError } from "better-auth/api";
import { ZodError } from "zod";
import { getUserOrganization } from "@/server/get-user-organization";
import { safeSignInEmail } from "@/lib/helpers/auth-helpers";
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
      return createErrorResult(
        authError instanceof APIError ? authError.message : "Invalid email or password",
      );
    }

    const userOrg = await getUserOrganization(result.user.id);
    const redirectUrl = userOrg ? `/${userOrg.slug}/dashboard` : "/onboarding";

    return createSuccessResult(result, "Signed in successfully!", redirectUrl);
  } catch (error) {
    if (error instanceof ZodError) {
      return createErrorResult(
        "Validation failed",
        error.flatten().fieldErrors as Record<string, string[]>,
      );
    }
    return createErrorResult(
      error instanceof Error ? error.message : "An unexpected error occurred",
    );
  }
}
