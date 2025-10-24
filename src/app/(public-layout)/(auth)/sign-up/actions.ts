"use server";

import { signupSchema, type SignupFormData } from "@/lib/validations/auth";
import { APIError } from "better-auth/api";
import { ZodError, z } from "zod";
import { safeSendVerificationEmail, safeSignUpEmail } from "@/lib/helpers/auth-helpers";
import {
  createSuccessResult,
  createErrorResult,
  type ActionResult,
} from "@/lib/helpers/action-helpers";
import { env } from "@/lib/env";

export async function signupAction(data: SignupFormData): Promise<ActionResult> {
  try {
    const validatedData = signupSchema.parse(data);
    const callbackUrl = new URL(`${env.betterAuth.baseURL}/sign-in`);
    callbackUrl.searchParams.set("verified", "true");

    const [authResult, authError] = await safeSignUpEmail(
      validatedData.email,
      validatedData.password,
      validatedData.name,
      callbackUrl.toString(),
    );

    if (authError && !authResult) {
      return createErrorResult(
        authError instanceof APIError ? authError.message : "Failed to create account",
      );
    }

    const verificationUrl = new URL(`${env.betterAuth.baseURL}/verify-email`);
    verificationUrl.searchParams.set("email", authResult.user.email);
    return createSuccessResult(
      authResult,
      "Account created successfully!",
      verificationUrl.toString(),
    );
  } catch (error) {
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
