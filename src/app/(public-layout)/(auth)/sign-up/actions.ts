"use server";

import { auth } from "@/lib/auth";
import { signupSchema, type SignupFormData } from "@/lib/validations/auth";
import { APIError } from "better-auth/api";
import { ZodError } from "zod";

type ActionState = {
  success: boolean;
  message?: string;
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
};

export async function signupAction(data: SignupFormData): Promise<ActionState> {
  try {
    // Validate the input data
    const validatedData = signupSchema.parse(data);

    // Attempt to sign up the user using better-auth server API
    await auth.api.signUpEmail({
      body: {
        email: validatedData.email,
        password: validatedData.password,
        name: validatedData.name,
      },
    });

    // Success - if we reach here, signup was successful
    return {
      success: true,
      message: "Account created successfully!",
    };
  } catch (error) {
    // Handle Better Auth API errors
    if (error instanceof APIError) {
      return {
        success: false,
        message: error.message || "Failed to create account",
      };
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Validation failed",
        errors: error.flatten().fieldErrors as {
          name?: string[];
          email?: string[];
          password?: string[];
          confirmPassword?: string[];
        },
      };
    }

    // Handle generic errors
    if (error instanceof Error) {
      return {
        success: false,
        message: error.message || "An unexpected error occurred",
      };
    }

    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}
