"use server";

import { APIError } from "better-auth/api";
import { ZodError, z } from "zod";
import {
  createErrorResult,
  createSuccessResult,
  type ActionResult,
} from "@/lib/helpers/action-helpers";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations/auth";
import { safeRequestPasswordReset } from "@/lib/helpers/auth-helpers";

export async function requestPasswordResetAction(
  data: ForgotPasswordFormData,
): Promise<ActionResult> {
  try {
    const { email } = forgotPasswordSchema.parse(data);

    const [result, error] = await safeRequestPasswordReset(email);

    if (error) {
      return createErrorResult(
        error instanceof APIError ? error.message : "Failed to send reset instructions",
      );
    }

    return createSuccessResult(result, "Password reset instructions sent. Check your email.");
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
