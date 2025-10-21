"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/utils";
import {
  createOrganizationSchema,
  type CreateOrganizationFormData,
} from "@/lib/validations/organization";

export type CreateOrganizationActionResult = {
  success: boolean;
  message?: string;
  errors?: {
    name?: string[];
  };
  redirectUrl?: string;
};

export async function createOrganizationAction(
  data: CreateOrganizationFormData,
): Promise<CreateOrganizationActionResult> {
  // Validate form data
  const validatedFields = createOrganizationSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please fix the errors below",
    };
  }

  // Get the current session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect(`/sign-in`);
  }

  try {
    // Create the organization using Better Auth
    const result = await auth.api.createOrganization({
      body: {
        name: validatedFields.data.name,
        slug: slugify(validatedFields.data.name),
      },
      headers: await headers(),
    });

    if (!result) {
      return {
        success: false,
        message: "Failed to create organization. Please try again.",
      };
    }

    // Store the slug for redirect
    const orgSlug = result.slug;
    return {
      success: true,
      message: "Organization created successfully!",
      redirectUrl: `/${orgSlug}/dashboard`,
    };
  } catch (error) {
    console.error("Error creating organization:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
