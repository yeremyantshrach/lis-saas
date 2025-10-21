"use server";

import { auth } from "@/lib/auth";
import { signinSchema, type SigninFormData } from "@/lib/validations/auth";
import { APIError } from "better-auth/api";
import { ZodError } from "zod";
import { getUserOrganization } from "@/server/get-user-organization";

type ActionState = {
  success: boolean;
  message?: string;
  redirectUrl?: string;
  errors?: {
    email?: string[];
    password?: string[];
  };
};

export async function signinAction(data: SigninFormData): Promise<ActionState> {
  try {
    // Validate the input data
    const validatedData = signinSchema.parse(data);

    // Attempt to sign in the user using better-auth server API
    const result = await auth.api.signInEmail({
      body: {
        email: validatedData.email,
        password: validatedData.password,
      },
    });

    const userOrg = await getUserOrganization(result.user.id);
    if (!userOrg) {
      return {
        success: true,
        message: "Signed in successfully!",
        redirectUrl: "/onboarding",
      };
    }

    // Success - if we reach here, signin was successful
    return {
      success: true,
      message: "Signed in successfully!",
      redirectUrl: `/${userOrg.slug}/dashboard`,
    };
  } catch (error) {
    // Handle Better Auth API errors
    if (error instanceof APIError) {
      return {
        success: false,
        message: error.message || "Invalid email or password",
      };
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Validation failed",
        errors: error.flatten().fieldErrors as {
          email?: string[];
          password?: string[];
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
