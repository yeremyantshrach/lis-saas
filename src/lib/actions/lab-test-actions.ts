"use server";

import { z, flattenError } from "zod";
import {
  createPcrTestSchema,
  deletePcrTestSchema,
  updatePcrTestSchema,
} from "@/lib/validations/lab-tests";
import {
  createPcrLabTest,
  deletePcrLabTest,
  updatePcrLabTest,
  type LabTestRlsContext,
} from "@/lib/helpers/lab-tests-helpers";
import {
  createErrorResult,
  createSuccessResult,
  type ActionResult,
} from "@/lib/helpers/action-helpers";
import { requirePermission } from "@/lib/server-permissions";
import { revalidatePath } from "next/cache";

function formatValidationErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[] | undefined> = flattenError(error).fieldErrors;
  const formatted: Record<string, string[]> = {};

  for (const field of Object.keys(fieldErrors)) {
    const messages = fieldErrors[field];
    if (!messages) continue;

    const collected: string[] = [];
    for (const message of messages) {
      if (message) {
        collected.push(message);
      }
    }
    if (collected.length > 0) {
      formatted[field] = collected;
    }
  }

  return formatted;
}

export async function createPcrTestAction(
  input: z.input<typeof createPcrTestSchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createPcrTestSchema.safeParse(input);
  if (!parsed.success) {
    return createErrorResult(
      "Please check the form for errors",
      formatValidationErrors(parsed.error),
    );
  }

  const { session } = await requirePermission("labTests:create");

  const organizationId = session.session?.activeOrganizationId ?? null;
  if (!organizationId) {
    return createErrorResult("Active organization is required to create tests");
  }

  const selectedLabId = parsed.data.labId ?? session.session?.activeLabId ?? null;
  if (!selectedLabId) {
    return createErrorResult("Select the lab this test belongs to");
  }

  const context: LabTestRlsContext = {
    userId: session.user.id,
    organizationId,
    labId: selectedLabId,
  };

  try {
    const trimOptional = (value?: string) => {
      if (!value) return undefined;
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    };

    const testCode = trimOptional(parsed.data.testCode)?.toUpperCase();
    const loincCode = trimOptional(parsed.data.loincCode);
    const cptCode = trimOptional(parsed.data.cptCode);
    const description = trimOptional(parsed.data.description);
    const defaultClinicalNotes = trimOptional(parsed.data.defaultClinicalNotes);

    const resistanceMarkers = parsed.data.resistanceMarkers ?? [];

    const created = await createPcrLabTest(context, {
      labId: selectedLabId,
      testCode,
      testName: parsed.data.testName,
      panel: parsed.data.panel,
      sampleType: parsed.data.sampleType,
      price: parsed.data.price,
      pathogenTargets: parsed.data.pathogenTargets,
      resistanceMarkers,
      loincCode,
      cptCode,
      description,
      defaultClinicalNotes,
    });

    if (parsed.data.orgSlug) {
      revalidatePath(`/${parsed.data.orgSlug}/lab-tests`);
    }

    return createSuccessResult(created);
  } catch (error) {
    console.error("Failed to create PCR test", error);
    const message =
      error instanceof Error && error.message ? error.message : "Failed to create PCR test";
    return createErrorResult(message);
  }
}

export async function updatePcrTestAction(
  input: z.input<typeof updatePcrTestSchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = updatePcrTestSchema.safeParse(input);
  if (!parsed.success) {
    return createErrorResult(
      "Please check the form for errors",
      formatValidationErrors(parsed.error),
    );
  }

  const { session } = await requirePermission("labTests:update");

  const organizationId = session.session?.activeOrganizationId ?? null;
  if (!organizationId) {
    return createErrorResult("Active organization is required to update tests");
  }

  const selectedLabId = parsed.data.labId ?? session.session?.activeLabId ?? null;
  if (!selectedLabId) {
    return createErrorResult("Select the lab this test belongs to");
  }

  const context: LabTestRlsContext = {
    userId: session.user.id,
    organizationId,
    labId: selectedLabId,
  };

  try {
    const trimOptional = (value?: string) => {
      if (!value) return undefined;
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    };

    const testCode = trimOptional(parsed.data.testCode)?.toUpperCase();
    const loincCode = trimOptional(parsed.data.loincCode);
    const cptCode = trimOptional(parsed.data.cptCode);
    const description = trimOptional(parsed.data.description);
    const defaultClinicalNotes = trimOptional(parsed.data.defaultClinicalNotes);

    const resistanceMarkers = parsed.data.resistanceMarkers ?? [];

    const updated = await updatePcrLabTest(context, {
      id: parsed.data.id,
      labId: selectedLabId,
      testCode,
      testName: parsed.data.testName,
      panel: parsed.data.panel,
      sampleType: parsed.data.sampleType,
      price: parsed.data.price,
      pathogenTargets: parsed.data.pathogenTargets,
      resistanceMarkers,
      loincCode,
      cptCode,
      description,
      defaultClinicalNotes,
    });

    if (parsed.data.orgSlug) {
      revalidatePath(`/${parsed.data.orgSlug}/lab-tests`);
    }

    return createSuccessResult(updated);
  } catch (error) {
    console.error("Failed to update PCR test", error);
    const message =
      error instanceof Error && error.message ? error.message : "Failed to update PCR test";
    return createErrorResult(message);
  }
}

export async function deletePcrTestAction(
  input: z.input<typeof deletePcrTestSchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = deletePcrTestSchema.safeParse(input);
  if (!parsed.success) {
    return createErrorResult(
      "Unable to delete test. Please try again.",
      formatValidationErrors(parsed.error),
    );
  }

  const { session } = await requirePermission("labTests:delete");

  const organizationId = session.session?.activeOrganizationId ?? null;
  if (!organizationId) {
    return createErrorResult("Active organization is required to delete tests");
  }

  const selectedLabId = parsed.data.labId ?? session.session?.activeLabId ?? null;
  if (!selectedLabId) {
    return createErrorResult("Select the lab this test belongs to");
  }

  const context: LabTestRlsContext = {
    userId: session.user.id,
    organizationId,
    labId: selectedLabId,
  };

  try {
    const deleted = await deletePcrLabTest(context, {
      id: parsed.data.id,
      labId: selectedLabId,
    });

    if (parsed.data.orgSlug) {
      revalidatePath(`/${parsed.data.orgSlug}/lab-tests`);
    }

    return createSuccessResult(deleted);
  } catch (error) {
    console.error("Failed to delete PCR test", error);
    const message =
      error instanceof Error && error.message ? error.message : "Failed to delete PCR test";
    return createErrorResult(message);
  }
}
