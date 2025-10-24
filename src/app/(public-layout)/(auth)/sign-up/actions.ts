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

export async function signupAction(data: SignupFormData): Promise<ActionResult> {
  try {
    const validatedData = signupSchema.parse(data);

    const [, authError] = await safeSignUpEmail(
      validatedData.email,
      validatedData.password,
      validatedData.name,
    );

    if (authError) {
      return createErrorResult(
        authError instanceof APIError ? authError.message : "Failed to create account",
      );
    }

    const [verificationResult, verificationError] = await safeSendVerificationEmail(
      validatedData.email,
    );

    const verificationUrl = `/verify-email?email=${encodeURIComponent(validatedData.email)}`;

    if (verificationError) {
      return createErrorResult(
        verificationError instanceof APIError
          ? verificationError.message
          : "Failed to send verification email",
        undefined,
        verificationUrl,
      );
    }

    return createSuccessResult(
      verificationResult,
      "Account created successfully!",
      verificationUrl,
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
