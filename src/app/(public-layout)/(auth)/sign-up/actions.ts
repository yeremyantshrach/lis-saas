"use server";

import { signupSchema, type SignupFormData } from "@/lib/validations/auth";
import { APIError } from "better-auth/api";
import { ZodError } from "zod";
import { safeSignUpEmail } from "@/lib/helpers/auth-helpers";
import {
  createSuccessResult,
  createErrorResult,
  type ActionResult,
} from "@/lib/helpers/action-helpers";

export async function signupAction(data: SignupFormData): Promise<ActionResult> {
  try {
    const validatedData = signupSchema.parse(data);

    const [result, authError] = await safeSignUpEmail(
      validatedData.email,
      validatedData.password,
      validatedData.name,
    );

    if (authError) {
      return createErrorResult(
        authError instanceof APIError ? authError.message : "Failed to create account",
      );
    }

    return createSuccessResult(result, "Account created successfully!");
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
