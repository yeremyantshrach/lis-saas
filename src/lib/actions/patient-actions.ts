"use server";

import { revalidatePath } from "next/cache";
import { z, flattenError } from "zod";
import type { PatientRlsContext } from "@/lib/helpers/patient-helpers";
import {
  archivePatientSchema,
  createPatientSchema,
  deletePatientDocumentSchema,
  linkPatientToLabSchema,
  matchPatientIdentitySchema,
  replacePatientInsuranceSchema,
  updatePatientBillingSchema,
  updatePatientContactSchema,
  updatePatientPersonalSchema,
  upsertPatientSchema,
} from "@/lib/validations/patients";
import {
  archivePatientDocument,
  connectPatientToLab,
  createOrLinkPatient,
  deletePatientDocumentRecord,
  findPatientMatches,
  getActivePatientDocumentByType,
  getPatientDocumentById,
  recordPatientDocument,
  replacePatientInsurancePoliciesForPatient,
  updateLabPatientStatus,
  updatePatientBillingPreferences,
  updatePatientContactDetails,
  updatePatientPersonalDetails,
  type PatientMatchSummary,
} from "@/lib/helpers/patient-helpers";
import { requirePermission } from "@/lib/server-permissions";
import {
  createErrorResult,
  createSuccessResult,
  type ActionResult,
} from "@/lib/helpers/action-helpers";
import { storage } from "@/lib/storage";
import { PATIENT_DOCUMENT_TYPES, type PatientDocumentType } from "@/lib/patients/constants";
import type { UpsertPatientInput } from "@/lib/validations/patients";

function formatValidationErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors = flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  const formatted: Record<string, string[]> = {};

  for (const field of Object.keys(fieldErrors)) {
    const messages = fieldErrors[field];
    if (messages && messages.length > 0) {
      formatted[field] = messages.filter(Boolean) as string[];
    }
  }

  return formatted;
}

function revalidatePatients(orgSlug?: string) {
  if (!orgSlug) return;
  revalidatePath(`/${orgSlug}/patients`);
}

export async function createPatientProfileAction(
  input: z.input<typeof createPatientSchema>,
): Promise<ActionResult<{ patientId: string; mode: "created" | "linked" }>> {
  const parsed = createPatientSchema.safeParse(input);
  if (!parsed.success) {
    return createErrorResult(
      "Please fix the highlighted errors",
      formatValidationErrors(parsed.error),
    );
  }

  const { session } = await requirePermission("labPatients:create");
  const organizationId = session.session?.activeOrganizationId ?? null;
  const labId = parsed.data.labId ?? session.session?.activeLabId ?? null;

  if (!labId && !session.user.isGlobalAdmin) {
    return createErrorResult("Select the lab you want to attach this patient to");
  }

  try {
    const result = await createOrLinkPatient(
      {
        userId: session.user.id,
        organizationId,
        labId: labId ?? null,
        isGlobalAdmin: session.user.isGlobalAdmin ?? false,
      },
      {
        labId: labId as string,
        legalFirstName: parsed.data.legalFirstName,
        legalLastName: parsed.data.legalLastName,
        dateOfBirth: parsed.data.dateOfBirth,
        gender: parsed.data.gender,
        primaryPhone: parsed.data.primaryPhone,
        email: parsed.data.email,
        primaryMedicalOfficeId: parsed.data.primaryMedicalOfficeId,
        primaryMedicalOfficeName: parsed.data.primaryMedicalOfficeName,
        emergencyContactName: parsed.data.emergencyContactName,
        emergencyContactPhone: parsed.data.emergencyContactPhone,
        emergencyContactRelationship: parsed.data.emergencyContactRelationship,
        contact: parsed.data.contact ?? null,
        billing: parsed.data.billing ?? null,
        insurancePolicies: parsed.data.insurancePolicies ?? [],
        notes: parsed.data.notes ?? null,
      },
    );

    revalidatePatients(parsed.data.orgSlug);

    return createSuccessResult(
      result,
      result.mode === "created" ? "Patient profile created" : "Patient linked to this lab",
    );
  } catch (error) {
    console.error("createPatientProfileAction failed", error);
    return createErrorResult("Unable to save patient. Please try again.");
  }
}

export async function updatePatientPersonalAction(
  input: z.input<typeof updatePatientPersonalSchema>,
): Promise<ActionResult> {
  const parsed = updatePatientPersonalSchema.safeParse(input);
  if (!parsed.success) {
    return createErrorResult(
      "Please fix the highlighted errors",
      formatValidationErrors(parsed.error),
    );
  }

  const { session } = await requirePermission("labPatients:update");
  const organizationId = session.session?.activeOrganizationId ?? null;
  const labId = session.session?.activeLabId ?? parsed.data.labId ?? null;

  if (!labId && !session.user.isGlobalAdmin) {
    return createErrorResult("Switch to a lab before updating patient details");
  }

  try {
    await updatePatientPersonalDetails(
      {
        userId: session.user.id,
        organizationId,
        labId,
        isGlobalAdmin: session.user.isGlobalAdmin ?? false,
      },
      {
        patientId: parsed.data.patientId,
        legalFirstName: parsed.data.legalFirstName,
        legalLastName: parsed.data.legalLastName,
        dateOfBirth: parsed.data.dateOfBirth,
        gender: parsed.data.gender,
        primaryPhone: parsed.data.primaryPhone,
        email: parsed.data.email,
        primaryMedicalOfficeId: parsed.data.primaryMedicalOfficeId,
        primaryMedicalOfficeName: parsed.data.primaryMedicalOfficeName,
        emergencyContactName: parsed.data.emergencyContactName,
        emergencyContactPhone: parsed.data.emergencyContactPhone,
        emergencyContactRelationship: parsed.data.emergencyContactRelationship,
      },
    );

    revalidatePatients(parsed.data.orgSlug);
    return createSuccessResult(undefined, "Patient details updated");
  } catch (error) {
    console.error("updatePatientPersonalAction failed", error);
    return createErrorResult("Unable to update patient");
  }
}

export async function updatePatientContactAction(
  input: z.input<typeof updatePatientContactSchema>,
): Promise<ActionResult> {
  const parsed = updatePatientContactSchema.safeParse(input);
  if (!parsed.success) {
    return createErrorResult(
      "Please fix the highlighted errors",
      formatValidationErrors(parsed.error),
    );
  }

  const { session } = await requirePermission("labPatients:update");
  const organizationId = session.session?.activeOrganizationId ?? null;
  const labId = session.session?.activeLabId ?? null;

  try {
    await updatePatientContactDetails(
      {
        userId: session.user.id,
        organizationId,
        labId,
        isGlobalAdmin: session.user.isGlobalAdmin ?? false,
      },
      parsed.data.patientId,
      parsed.data.contact,
    );

    revalidatePatients(parsed.data.orgSlug);
    return createSuccessResult(undefined, "Contact information saved");
  } catch (error) {
    console.error("updatePatientContactAction failed", error);
    return createErrorResult("Unable to update contact information");
  }
}

export async function updatePatientBillingAction(
  input: z.input<typeof updatePatientBillingSchema>,
): Promise<ActionResult> {
  const parsed = updatePatientBillingSchema.safeParse(input);
  if (!parsed.success) {
    return createErrorResult(
      "Please fix the highlighted errors",
      formatValidationErrors(parsed.error),
    );
  }

  const { session } = await requirePermission("labPatients:update");
  const organizationId = session.session?.activeOrganizationId ?? null;
  const labId = session.session?.activeLabId ?? null;

  try {
    await updatePatientBillingPreferences(
      {
        userId: session.user.id,
        organizationId,
        labId,
        isGlobalAdmin: session.user.isGlobalAdmin ?? false,
      },
      parsed.data.patientId,
      parsed.data.billing,
    );

    revalidatePatients(parsed.data.orgSlug);
    return createSuccessResult(undefined, "Billing preferences saved");
  } catch (error) {
    console.error("updatePatientBillingAction failed", error);
    return createErrorResult("Unable to save billing preferences");
  }
}

export async function replacePatientInsuranceAction(
  input: z.input<typeof replacePatientInsuranceSchema>,
): Promise<ActionResult> {
  const parsed = replacePatientInsuranceSchema.safeParse(input);
  if (!parsed.success) {
    return createErrorResult(
      "Please fix the highlighted errors",
      formatValidationErrors(parsed.error),
    );
  }

  const { session } = await requirePermission("labPatients:update");
  const organizationId = session.session?.activeOrganizationId ?? null;
  const labId = session.session?.activeLabId ?? null;

  try {
    await replacePatientInsurancePoliciesForPatient(
      {
        userId: session.user.id,
        organizationId,
        labId,
        isGlobalAdmin: session.user.isGlobalAdmin ?? false,
      },
      parsed.data.patientId,
      parsed.data.policies,
    );
    revalidatePatients(parsed.data.orgSlug);
    return createSuccessResult(undefined, "Insurance policies updated");
  } catch (error) {
    console.error("replacePatientInsuranceAction failed", error);
    return createErrorResult("Unable to update insurance policies");
  }
}

export async function linkPatientToLabAction(
  input: z.input<typeof linkPatientToLabSchema>,
): Promise<ActionResult> {
  const parsed = linkPatientToLabSchema.safeParse(input);
  if (!parsed.success) {
    return createErrorResult("Invalid payload", formatValidationErrors(parsed.error));
  }

  const { session } = await requirePermission("labPatients:update");
  const organizationId = session.session?.activeOrganizationId ?? null;
  const labId = parsed.data.labId ?? session.session?.activeLabId ?? null;

  if (!labId && !session.user.isGlobalAdmin) {
    return createErrorResult("Select a lab before linking");
  }

  try {
    await connectPatientToLab(
      {
        userId: session.user.id,
        organizationId,
        labId,
        isGlobalAdmin: session.user.isGlobalAdmin ?? false,
      },
      {
        patientId: parsed.data.patientId,
        labId: labId as string,
        notes: parsed.data.notes,
      },
    );

    revalidatePatients(parsed.data.orgSlug);
    return createSuccessResult(undefined, "Patient linked to this lab");
  } catch (error) {
    console.error("linkPatientToLabAction failed", error);
    return createErrorResult("Unable to link patient");
  }
}

export async function archivePatientProfileAction(
  input: z.input<typeof archivePatientSchema>,
): Promise<ActionResult> {
  const parsed = archivePatientSchema.safeParse(input);
  if (!parsed.success) {
    return createErrorResult("Invalid payload", formatValidationErrors(parsed.error));
  }

  const { session } = await requirePermission("labPatients:delete");
  const organizationId = session.session?.activeOrganizationId ?? null;
  const labId = parsed.data.labId ?? session.session?.activeLabId ?? null;

  if (!labId && !session.user.isGlobalAdmin) {
    return createErrorResult("Select a lab before archiving the patient");
  }

  try {
    await updateLabPatientStatus(
      {
        userId: session.user.id,
        organizationId,
        labId,
        isGlobalAdmin: session.user.isGlobalAdmin ?? false,
      },
      parsed.data.patientId,
      labId as string,
      parsed.data.status,
    );

    revalidatePatients(parsed.data.orgSlug);
    return createSuccessResult(undefined, "Patient status updated");
  } catch (error) {
    console.error("archivePatientProfileAction failed", error);
    return createErrorResult("Unable to update patient status");
  }
}

export async function matchPatientProfileAction(
  input: z.input<typeof matchPatientIdentitySchema>,
): Promise<ActionResult<{ matches: PatientMatchSummary[] }>> {
  const parsed = matchPatientIdentitySchema.safeParse(input);
  if (!parsed.success) {
    return createErrorResult(
      "Provide the patient's basic identity info",
      formatValidationErrors(parsed.error),
    );
  }

  const { session } = await requirePermission("labPatients:read");
  const organizationId = session.session?.activeOrganizationId ?? null;
  const labId = session.session?.activeLabId ?? null;

  try {
    const matches = await findPatientMatches(
      {
        userId: session.user.id,
        organizationId,
        labId,
        isGlobalAdmin: session.user.isGlobalAdmin ?? false,
      },
      {
        legalFirstName: parsed.data.legalFirstName,
        legalLastName: parsed.data.legalLastName,
        dateOfBirth: parsed.data.dateOfBirth,
        primaryPhone: parsed.data.primaryPhone,
        email: parsed.data.email,
      },
    );

    return createSuccessResult({ matches });
  } catch (error) {
    console.error("matchPatientProfileAction failed", error);
    return createErrorResult("Unable to search for matching patients");
  }
}

const documentUploadSchema = z.object({
  patientId: z.string().uuid(),
  documentType: z.enum(PATIENT_DOCUMENT_TYPES),
  uploadDeferred: z.coerce.boolean().optional(),
  orgSlug: z.string().optional(),
});

const replaceDocumentSchema = documentUploadSchema.extend({
  documentId: z.string().uuid(),
});

export async function uploadPatientDocumentAction(formData: FormData): Promise<ActionResult> {
  const parsed = documentUploadSchema.safeParse({
    patientId: formData.get("patientId"),
    documentType: formData.get("documentType"),
    uploadDeferred: formData.get("uploadDeferred"),
    orgSlug: formData.get("orgSlug"),
  });

  if (!parsed.success) {
    return createErrorResult("Invalid document metadata", formatValidationErrors(parsed.error));
  }

  const { session } = await requirePermission("labPatients:update");
  const organizationId = session.session?.activeOrganizationId ?? null;
  const labId = session.session?.activeLabId ?? null;
  const file = formData.get("file");

  const uploadDeferred = parsed.data.uploadDeferred ?? false;

  if (!uploadDeferred && !(file instanceof File) && !session.user.isGlobalAdmin) {
    return createErrorResult("Select a file to upload");
  }

  try {
    const context = {
      userId: session.user.id,
      organizationId,
      labId,
      isGlobalAdmin: session.user.isGlobalAdmin ?? false,
    } as PatientRlsContext;

    const existingDocument = await getActivePatientDocumentByType(
      context,
      parsed.data.patientId,
      parsed.data.documentType,
    );

    if (file instanceof File && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const storagePath = `patients/${parsed.data.patientId}/${Date.now()}-${file.name}`;
      const saved = await storage.save(Buffer.from(arrayBuffer), {
        path: storagePath,
        contentType: file.type,
      });

      if (existingDocument) {
        if (existingDocument.storageDriver === storage.name && existingDocument.storageKey) {
          await storage.delete(existingDocument.storageKey);
        }

        await deletePatientDocumentRecord(context, existingDocument.id);
      }

      await recordPatientDocument(context, {
        patientId: parsed.data.patientId,
        documentType: parsed.data.documentType as PatientDocumentType,
        storageDriver: saved.driver,
        storageKey: saved.key,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        fileSize: file.size,
        uploadedBy: session.user.id,
        metadata: { url: saved.url ?? undefined },
      });
    } else if (uploadDeferred) {
      if (existingDocument) {
        if (existingDocument.storageDriver === storage.name && existingDocument.storageKey) {
          await storage.delete(existingDocument.storageKey);
        }

        await deletePatientDocumentRecord(context, existingDocument.id);
      }

      await recordPatientDocument(context, {
        patientId: parsed.data.patientId,
        documentType: parsed.data.documentType as PatientDocumentType,
        storageDriver: "pending",
        storageKey: `pending://${parsed.data.patientId}/${Date.now()}`,
        fileName: "Pending Upload",
        contentType: "application/octet-stream",
        fileSize: 0,
        uploadedBy: session.user.id,
        uploadDeferred: true,
        status: "pending",
      });
    } else {
      return createErrorResult("A file is required unless you mark the upload as pending");
    }

    revalidatePatients(parsed.data.orgSlug);
    return createSuccessResult(undefined, "Document saved");
  } catch (error) {
    console.error("uploadPatientDocumentAction failed", error);
    return createErrorResult("Unable to save document");
  }
}

export async function replacePatientDocumentFileAction(formData: FormData): Promise<ActionResult> {
  const parsed = replaceDocumentSchema.safeParse({
    documentId: formData.get("documentId"),
    patientId: formData.get("patientId"),
    documentType: formData.get("documentType"),
    uploadDeferred: formData.get("uploadDeferred"),
    orgSlug: formData.get("orgSlug"),
  });

  if (!parsed.success) {
    return createErrorResult("Invalid document metadata", formatValidationErrors(parsed.error));
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return createErrorResult("Select a file to upload");
  }

  const { session } = await requirePermission("labPatients:update");
  const organizationId = session.session?.activeOrganizationId ?? null;
  const labId = session.session?.activeLabId ?? null;

  try {
    const existingDocument = await getPatientDocumentById(
      {
        userId: session.user.id,
        organizationId,
        labId,
        isGlobalAdmin: session.user.isGlobalAdmin ?? false,
      },
      parsed.data.documentId,
    );

    if (!existingDocument || existingDocument.patientId !== parsed.data.patientId) {
      return createErrorResult("Document not found for this patient");
    }

    const arrayBuffer = await file.arrayBuffer();
    const storagePath = `patients/${parsed.data.patientId}/${Date.now()}-${file.name}`;
    const saved = await storage.save(Buffer.from(arrayBuffer), {
      path: storagePath,
      contentType: file.type,
    });

    if (existingDocument.storageDriver === storage.name && existingDocument.storageKey) {
      await storage.delete(existingDocument.storageKey);
    }

    await archivePatientDocument(
      {
        userId: session.user.id,
        organizationId,
        labId,
        isGlobalAdmin: session.user.isGlobalAdmin ?? false,
      },
      parsed.data.documentId,
    );

    await recordPatientDocument(
      {
        userId: session.user.id,
        organizationId,
        labId,
        isGlobalAdmin: session.user.isGlobalAdmin ?? false,
      },
      {
        patientId: parsed.data.patientId,
        documentType: parsed.data.documentType as PatientDocumentType,
        storageDriver: saved.driver,
        storageKey: saved.key,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        fileSize: file.size,
        uploadedBy: session.user.id,
        metadata: { url: saved.url ?? undefined },
      },
    );

    revalidatePatients(parsed.data.orgSlug);
    return createSuccessResult(undefined, "Document replaced");
  } catch (error) {
    console.error("replacePatientDocumentFileAction failed", error);
    return createErrorResult("Unable to replace document");
  }
}

export async function deletePatientDocumentAction(
  input: z.input<typeof deletePatientDocumentSchema>,
): Promise<ActionResult> {
  const parsed = deletePatientDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return createErrorResult("Invalid payload", formatValidationErrors(parsed.error));
  }

  const { session } = await requirePermission("labPatients:delete");
  const organizationId = session.session?.activeOrganizationId ?? null;
  const labId = session.session?.activeLabId ?? null;

  try {
    const existingDocument = await getPatientDocumentById(
      {
        userId: session.user.id,
        organizationId,
        labId,
        isGlobalAdmin: session.user.isGlobalAdmin ?? false,
      },
      parsed.data.documentId,
    );

    if (!existingDocument || existingDocument.patientId !== parsed.data.patientId) {
      return createErrorResult("Document not found");
    }

    if (existingDocument.storageDriver === storage.name && existingDocument.storageKey) {
      await storage.delete(existingDocument.storageKey);
    }

    await deletePatientDocumentRecord(
      {
        userId: session.user.id,
        organizationId,
        labId,
        isGlobalAdmin: session.user.isGlobalAdmin ?? false,
      },
      parsed.data.documentId,
    );

    revalidatePatients(parsed.data.orgSlug);
    return createSuccessResult(undefined, "Document removed");
  } catch (error) {
    console.error("deletePatientDocumentAction failed", error);
    return createErrorResult("Unable to delete document");
  }
}

export async function upsertPatientProfileAction(
  input: UpsertPatientInput,
): Promise<ActionResult<{ patientId: string }>> {
  const parsed = upsertPatientSchema.safeParse(input);
  if (!parsed.success) {
    return createErrorResult(
      "Please fix the highlighted errors",
      formatValidationErrors(parsed.error),
    );
  }

  if (!parsed.data.patientId) {
    return createPatientProfileAction(parsed.data);
  }

  const patientId = parsed.data.patientId;
  const { session } = await requirePermission("labPatients:update");
  const organizationId = session.session?.activeOrganizationId ?? null;
  const labId = parsed.data.labId ?? session.session?.activeLabId ?? null;

  if (!labId && !session.user.isGlobalAdmin) {
    return createErrorResult("Select the lab you want to attach this patient to");
  }

  try {
    const context = {
      userId: session.user.id,
      organizationId,
      labId,
      isGlobalAdmin: session.user.isGlobalAdmin ?? false,
    };

    await updatePatientPersonalDetails(context, {
      patientId,
      legalFirstName: parsed.data.legalFirstName,
      legalLastName: parsed.data.legalLastName,
      dateOfBirth: parsed.data.dateOfBirth,
      gender: parsed.data.gender,
      primaryPhone: parsed.data.primaryPhone,
      email: parsed.data.email,
      primaryMedicalOfficeId: parsed.data.primaryMedicalOfficeId,
      primaryMedicalOfficeName: parsed.data.primaryMedicalOfficeName,
      emergencyContactName: parsed.data.emergencyContactName,
      emergencyContactPhone: parsed.data.emergencyContactPhone,
      emergencyContactRelationship: parsed.data.emergencyContactRelationship,
    });

    if (parsed.data.contact) {
      await updatePatientContactDetails(context, patientId, parsed.data.contact);
    }

    if (parsed.data.billing) {
      await updatePatientBillingPreferences(context, patientId, parsed.data.billing);
    }

    if (parsed.data.insurancePolicies) {
      await replacePatientInsurancePoliciesForPatient(
        context,
        patientId,
        parsed.data.insurancePolicies,
      );
    }

    if (parsed.data.previousLabId && labId && parsed.data.previousLabId !== labId) {
      await updateLabPatientStatus(
        { ...context, labId: parsed.data.previousLabId },
        patientId,
        parsed.data.previousLabId,
        "archived",
      );
    }

    if (labId) {
      await connectPatientToLab(context, {
        patientId,
        labId,
      });
    }

    revalidatePatients(parsed.data.orgSlug);
    return createSuccessResult({ patientId }, "Patient updated");
  } catch (error) {
    console.error("upsertPatientProfileAction failed", error);
    return createErrorResult("Unable to save patient. Please try again.");
  }
}
