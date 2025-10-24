"use server";

import { APIError } from "better-auth/api";
import { ZodError, z } from "zod";
import {
  createErrorResult,
  createSuccessResult,
  type ActionResult,
} from "@/lib/helpers/action-helpers";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations/auth";
import { safeResetPassword } from "@/lib/helpers/auth-helpers";

export async function resetPasswordAction(data: ResetPasswordFormData): Promise<ActionResult> {
  try {
    const { token, password } = resetPasswordSchema.parse(data);

    const [result, error] = await safeResetPassword(token, password);

    if (error) {
      return createErrorResult(
        error instanceof APIError ? error.message : "Failed to reset password",
      );
    }

    return createSuccessResult(
      result,
      "Password updated. You can sign in with your new password.",
      "/sign-in?reset=success",
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
