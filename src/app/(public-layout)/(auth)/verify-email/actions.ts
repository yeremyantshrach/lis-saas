"use server";

import { APIError } from "better-auth/api";
import { ZodError, z } from "zod";
import {
  createErrorResult,
  createSuccessResult,
  type ActionResult,
} from "@/lib/helpers/action-helpers";
import { safeSendVerificationEmail } from "@/lib/helpers/auth-helpers";
import { resendVerificationSchema, type ResendVerificationFormData } from "@/lib/validations/auth";

export async function resendVerificationEmailAction(
  data: ResendVerificationFormData,
): Promise<ActionResult> {
  try {
    const { email } = resendVerificationSchema.parse(data);

    const [result, error] = await safeSendVerificationEmail(email);

    if (error) {
      return createErrorResult(
        error instanceof APIError ? error.message : "Failed to send verification email",
        undefined,
        `/verify-email?email=${encodeURIComponent(email)}`,
      );
    }

    return createSuccessResult(result, "Verification email sent. Check your inbox.");
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
