"use server";

import { redirect } from "next/navigation";
import { slugify } from "@/lib/utils";
import {
  createOrganizationSchema,
  type CreateOrganizationFormData,
} from "@/lib/validations/organization";
import { safeGetSession, safeCreateOrganization } from "@/lib/helpers/auth-helpers";
import {
  createSuccessResult,
  createErrorResult,
  type ActionResult,
} from "@/lib/helpers/action-helpers";

export async function createOrganizationAction(
  data: CreateOrganizationFormData,
): Promise<ActionResult> {
  const validatedFields = createOrganizationSchema.safeParse(data);

  if (!validatedFields.success) {
    return createErrorResult(
      "Please fix the errors below",
      validatedFields.error.flatten().fieldErrors,
    );
  }

  const [session, sessionError] = await safeGetSession();

  if (sessionError || !session?.user) {
    redirect(`/sign-in`);
  }

  const [result, orgError] = await safeCreateOrganization(
    validatedFields.data.name,
    slugify(validatedFields.data.name),
  );

  if (orgError || !result) {
    return createErrorResult(
      orgError instanceof Error
        ? orgError.message
        : "Failed to create organization. Please try again.",
    );
  }

  return createSuccessResult(
    result,
    "Organization created successfully!",
    `/${result.slug}/dashboard`,
  );
}
