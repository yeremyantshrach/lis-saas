import { sql, and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/lib/database";
import {
  labPatientProfiles,
  patientBillingProfiles,
  patientContactDetails,
  patientDocuments,
  patientInsurancePolicies,
  patients,
  patientRegistry,
} from "@/lib/patients/schema";
import { labs as authLabs } from "@/lib/auth/auth-schema";
import type {
  PatientDocumentStatus,
  PatientDocumentType,
  PatientGender,
  PatientPaymentMethod,
  PatientProfileStatus,
} from "@/lib/patients/constants";
import { PATIENT_DOCUMENT_STATUSES } from "@/lib/patients/constants";
import { createHash } from "node:crypto";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface PatientRlsContext {
  userId: string;
  organizationId: string | null;
  labId: string | null;
  isGlobalAdmin?: boolean;
}

export interface LabPatientListItem {
  patientId: string;
  labId: string;
  labName: string | null;
  legalFirstName: string;
  legalLastName: string;
  dateOfBirth: Date;
  gender: PatientGender;
  primaryPhone: string;
  email: string | null;
  primaryMedicalOfficeName: string | null;
  insuranceProviders: string[];
  status: PatientProfileStatus;
  connectedAt: Date;
  lastAccessedAt: Date | null;
}

export interface PatientContactRecord {
  streetAddress: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
}

export interface PatientBillingRecord {
  preferredPaymentMethod: PatientPaymentMethod | null;
  billingEmail: string | null;
  paperlessBillingEnabled: boolean;
  patientIsGuarantor: boolean;
}

export interface PatientInsuranceRecord {
  id: string;
  insuranceProvider: string;
  planName: string | null;
  policyNumber: string | null;
  groupNumber: string | null;
  subscriberId: string | null;
  subscriberName: string | null;
  subscriberRelationship: string | null;
  effectiveDate: Date | null;
  copayAmount: string | null;
  deductibleBalance: string | null;
  medicareEligible: boolean;
  medicaidEligible: boolean;
  metadata: Record<string, unknown> | null;
}

export interface PatientDocumentRecord {
  id: string;
  patientId: string;
  documentType: PatientDocumentType;
  status: PatientDocumentStatus;
  storageDriver: string;
  storageKey: string;
  fileName: string;
  contentType: string;
  fileSize: string;
  encryptionKeyId: string | null;
  uploadDeferred: boolean;
  metadata: Record<string, unknown> | null;
  uploadedBy: string | null;
  uploadedAt: Date;
  archivedAt: Date | null;
}

export interface PatientLabProfileRecord {
  id: string;
  labId: string;
  labName: string | null;
  status: PatientProfileStatus;
  internalReference: string | null;
  notes: string | null;
  connectedBy: string | null;
  connectedAt: Date;
  lastAccessedAt: Date | null;
}

export interface PatientProfileRecord {
  id: string;
  legalFirstName: string;
  legalLastName: string;
  dateOfBirth: Date;
  gender: PatientGender;
  primaryPhone: string;
  email: string | null;
  primaryMedicalOfficeId: string | null;
  primaryMedicalOfficeName: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  labProfiles: PatientLabProfileRecord[];
  contact?: PatientContactRecord | null;
  billing?: PatientBillingRecord | null;
  insurancePolicies: PatientInsuranceRecord[];
  documents: PatientDocumentRecord[];
}

export interface PatientMatchSummary {
  patientId: string;
  legalFirstName: string;
  legalLastName: string;
  dateOfBirth: Date;
  primaryPhone: string;
  email: string | null;
  labs: { id: string; name: string | null; status: PatientProfileStatus }[];
}

export interface PatientIdentityInput {
  legalFirstName: string;
  legalLastName: string;
  dateOfBirth: Date;
  primaryPhone: string;
  email?: string | null;
}

export interface PatientPersonalDetailsInput extends PatientIdentityInput {
  patientId: string;
  gender: PatientGender;
  primaryMedicalOfficeId?: string | null;
  primaryMedicalOfficeName?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
}

export interface ContactDetailsInput {
  streetAddress: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
}

export interface BillingPreferencesInput {
  preferredPaymentMethod?: PatientPaymentMethod | null;
  billingEmail?: string | null;
  paperlessBillingEnabled: boolean;
  patientIsGuarantor: boolean;
}

export interface InsurancePolicyInput {
  id?: string;
  insuranceProvider: string;
  planName?: string | null;
  policyNumber?: string | null;
  groupNumber?: string | null;
  subscriberId?: string | null;
  subscriberName?: string | null;
  subscriberRelationship?: string | null;
  effectiveDate?: Date | null;
  copayAmount?: string | null;
  deductibleBalance?: string | null;
  medicareEligible?: boolean;
  medicaidEligible?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface CreatePatientPayload {
  labId: string;
  legalFirstName: string;
  legalLastName: string;
  dateOfBirth: Date;
  gender: PatientGender;
  primaryPhone: string;
  email?: string | null;
  primaryMedicalOfficeId?: string | null;
  primaryMedicalOfficeName?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
  contact?: ContactDetailsInput | null;
  billing?: BillingPreferencesInput | null;
  insurancePolicies?: InsurancePolicyInput[];
  notes?: string | null;
}

export interface PatientDocumentPayload {
  patientId: string;
  documentType: PatientDocumentType;
  storageDriver: string;
  storageKey: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  encryptionKeyId?: string | null;
  uploadDeferred?: boolean;
  metadata?: Record<string, unknown> | null;
  uploadedBy: string;
  status?: PatientDocumentStatus;
}

export interface PatientListFilters {
  labId: string;
  status?: PatientProfileStatus[];
  search?: string;
  limit?: number;
}

type NormalizedIdentity = {
  trimmedFirstName: string;
  trimmedLastName: string;
  normalizedFirstName: string;
  normalizedLastName: string;
  normalizedPhone: string;
  normalizedEmail?: string | null;
  dateOfBirth: Date;
  identityHash: string;
  phoneHash: string;
  emailHash?: string | null;
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeName(value: string): string {
  return normalizeWhitespace(value).toLowerCase();
}

function normalizePhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) {
    throw new Error("Phone number is required");
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  return digits.startsWith("+") ? digits : `+${digits}`;
}

function normalizeEmailAddress(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed.toLowerCase();
}

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeIdentity(input: PatientIdentityInput): NormalizedIdentity {
  const trimmedFirstName = normalizeWhitespace(input.legalFirstName);
  const trimmedLastName = normalizeWhitespace(input.legalLastName);
  const normalizedFirstName = normalizeName(input.legalFirstName);
  const normalizedLastName = normalizeName(input.legalLastName);
  const normalizedPhone = normalizePhoneNumber(input.primaryPhone);
  const normalizedEmail = normalizeEmailAddress(input.email);
  const dobIso = input.dateOfBirth.toISOString().slice(0, 10);

  const identityParts = [
    normalizedFirstName,
    normalizedLastName,
    dobIso,
    normalizedPhone,
    normalizedEmail ?? "",
  ].join("|");

  return {
    trimmedFirstName,
    trimmedLastName,
    normalizedFirstName,
    normalizedLastName,
    normalizedPhone,
    normalizedEmail,
    dateOfBirth: input.dateOfBirth,
    identityHash: hashValue(identityParts),
    phoneHash: hashValue(normalizedPhone),
    emailHash: normalizedEmail ? hashValue(normalizedEmail) : null,
  };
}

async function applyPatientRlsContext(tx: Transaction, context: PatientRlsContext) {
  await tx.execute(sql`select set_config('lis.current_user_id', ${context.userId ?? ""}, true)`);
  await tx.execute(
    sql`select set_config('lis.active_organization_id', ${context.organizationId ?? ""}, true)`,
  );
  await tx.execute(sql`select set_config('lis.active_lab_id', ${context.labId ?? ""}, true)`);
  await tx.execute(
    sql`select set_config('lis.is_global_admin', ${context.isGlobalAdmin ? "true" : "false"}, true)`,
  );
}

async function ensurePatientRegistryEntry(
  tx: Transaction,
  identity: NormalizedIdentity,
): Promise<{ patientId: string; isNew: boolean }> {
  const existing = await tx
    .select({ id: patientRegistry.id })
    .from(patientRegistry)
    .where(eq(patientRegistry.identityHash, identity.identityHash))
    .limit(1);

  if (existing[0]) {
    return { patientId: existing[0].id, isNew: false };
  }

  try {
    const inserted = await tx
      .insert(patientRegistry)
      .values({
        identityHash: identity.identityHash,
        primaryPhoneHash: identity.phoneHash,
        emailHash: identity.emailHash,
      })
      .returning({ id: patientRegistry.id });

    return { patientId: inserted[0].id, isNew: true };
  } catch (error) {
    const pgError = error as { code?: string };
    if (pgError?.code === "23505") {
      const conflict = await tx
        .select({ id: patientRegistry.id })
        .from(patientRegistry)
        .where(eq(patientRegistry.identityHash, identity.identityHash))
        .limit(1);
      if (conflict[0]) {
        return { patientId: conflict[0].id, isNew: false };
      }
    }
    throw error;
  }
}

async function ensureLabPatientProfile(
  tx: Transaction,
  input: { patientId: string; labId: string; connectedBy: string; notes?: string | null },
) {
  const existing = await tx
    .select({
      id: labPatientProfiles.id,
      status: labPatientProfiles.status,
    })
    .from(labPatientProfiles)
    .where(
      and(
        eq(labPatientProfiles.labId, input.labId),
        eq(labPatientProfiles.patientId, input.patientId),
      ),
    )
    .limit(1);

  if (existing[0]) {
    if (existing[0].status === "archived") {
      const updates: Record<string, unknown> = {
        status: "active",
        lastAccessedAt: new Date(),
        updatedAt: new Date(),
      };
      if (input.notes) {
        updates.notes = input.notes;
      }
      await tx
        .update(labPatientProfiles)
        .set(updates)
        .where(eq(labPatientProfiles.id, existing[0].id));
    }
    return existing[0];
  }

  const inserted = await tx
    .insert(labPatientProfiles)
    .values({
      patientId: input.patientId,
      labId: input.labId,
      status: "active",
      notes: input.notes ?? null,
      connectedBy: input.connectedBy,
      connectedAt: new Date(),
      lastAccessedAt: new Date(),
    })
    .returning({ id: labPatientProfiles.id, status: labPatientProfiles.status });

  return inserted[0];
}

async function upsertContactDetails(
  tx: Transaction,
  patientId: string,
  contact?: ContactDetailsInput | null,
) {
  if (!contact) return;
  await tx
    .insert(patientContactDetails)
    .values({
      patientId,
      streetAddress: normalizeWhitespace(contact.streetAddress),
      addressLine2: contact.addressLine2 ? normalizeWhitespace(contact.addressLine2) : null,
      city: normalizeWhitespace(contact.city),
      state: normalizeWhitespace(contact.state),
      postalCode: normalizeWhitespace(contact.postalCode),
    })
    .onConflictDoUpdate({
      target: patientContactDetails.patientId,
      set: {
        streetAddress: normalizeWhitespace(contact.streetAddress),
        addressLine2: contact.addressLine2 ? normalizeWhitespace(contact.addressLine2) : null,
        city: normalizeWhitespace(contact.city),
        state: normalizeWhitespace(contact.state),
        postalCode: normalizeWhitespace(contact.postalCode),
        updatedAt: new Date(),
      },
    });
}

async function upsertBillingProfile(
  tx: Transaction,
  patientId: string,
  billing?: BillingPreferencesInput | null,
) {
  if (!billing) return;
  await tx
    .insert(patientBillingProfiles)
    .values({
      patientId,
      preferredPaymentMethod: billing.preferredPaymentMethod ?? null,
      billingEmail: normalizeEmailAddress(billing.billingEmail) ?? null,
      paperlessBillingEnabled: billing.paperlessBillingEnabled,
      patientIsGuarantor: billing.patientIsGuarantor,
    })
    .onConflictDoUpdate({
      target: patientBillingProfiles.patientId,
      set: {
        preferredPaymentMethod: billing.preferredPaymentMethod ?? null,
        billingEmail: normalizeEmailAddress(billing.billingEmail) ?? null,
        paperlessBillingEnabled: billing.paperlessBillingEnabled,
        patientIsGuarantor: billing.patientIsGuarantor,
        updatedAt: new Date(),
      },
    });
}

async function replaceInsurancePolicies(
  tx: Transaction,
  patientId: string,
  policies?: InsurancePolicyInput[],
) {
  if (!policies) return;
  await tx
    .delete(patientInsurancePolicies)
    .where(eq(patientInsurancePolicies.patientId, patientId));
  if (policies.length === 0) return;
  await tx.insert(patientInsurancePolicies).values(
    policies.map((policy) => ({
      patientId,
      insuranceProvider: normalizeWhitespace(policy.insuranceProvider),
      planName: policy.planName ? normalizeWhitespace(policy.planName) : null,
      policyNumber: policy.policyNumber ? normalizeWhitespace(policy.policyNumber) : null,
      groupNumber: policy.groupNumber ? normalizeWhitespace(policy.groupNumber) : null,
      subscriberId: policy.subscriberId ? normalizeWhitespace(policy.subscriberId) : null,
      subscriberName: policy.subscriberName ? normalizeWhitespace(policy.subscriberName) : null,
      subscriberRelationship: policy.subscriberRelationship
        ? normalizeWhitespace(policy.subscriberRelationship)
        : null,
      effectiveDate: policy.effectiveDate ?? null,
      copayAmount: policy.copayAmount ?? null,
      deductibleBalance: policy.deductibleBalance ?? null,
      medicareEligible: policy.medicareEligible ?? false,
      medicaidEligible: policy.medicaidEligible ?? false,
      metadata: policy.metadata ?? null,
    })),
  );
}

export async function createOrLinkPatient(
  context: PatientRlsContext,
  payload: CreatePatientPayload,
) {
  if (!payload.labId || (!context.labId && !context.isGlobalAdmin)) {
    throw new Error("Active lab is required to create patients");
  }

  const resolvedContext: PatientRlsContext = {
    ...context,
    labId: payload.labId,
  };

  return db.transaction(async (tx) => {
    await applyPatientRlsContext(tx, resolvedContext);

    const normalizedIdentity = normalizeIdentity({
      legalFirstName: payload.legalFirstName,
      legalLastName: payload.legalLastName,
      dateOfBirth: payload.dateOfBirth,
      primaryPhone: payload.primaryPhone,
      email: payload.email,
    });

    const registryEntry = await ensurePatientRegistryEntry(tx, normalizedIdentity);

    if (registryEntry.isNew) {
      await tx.insert(patients).values({
        id: registryEntry.patientId,
        legalFirstName: normalizedIdentity.trimmedFirstName,
        legalLastName: normalizedIdentity.trimmedLastName,
        dateOfBirth: normalizedIdentity.dateOfBirth,
        gender: payload.gender,
        primaryPhone: normalizedIdentity.normalizedPhone,
        email: normalizedIdentity.normalizedEmail ?? null,
        primaryMedicalOfficeId: payload.primaryMedicalOfficeId ?? null,
        primaryMedicalOfficeName: payload.primaryMedicalOfficeName
          ? normalizeWhitespace(payload.primaryMedicalOfficeName)
          : null,
        emergencyContactName: payload.emergencyContactName
          ? normalizeWhitespace(payload.emergencyContactName)
          : null,
        emergencyContactPhone: payload.emergencyContactPhone
          ? normalizePhoneNumber(payload.emergencyContactPhone)
          : null,
        emergencyContactRelationship: payload.emergencyContactRelationship
          ? normalizeWhitespace(payload.emergencyContactRelationship)
          : null,
        createdBy: context.userId,
        lastSeenLabId: payload.labId,
      });
    }

    await ensureLabPatientProfile(tx, {
      patientId: registryEntry.patientId,
      labId: payload.labId,
      connectedBy: context.userId,
      notes: payload.notes,
    });

    await upsertContactDetails(tx, registryEntry.patientId, payload.contact);
    await upsertBillingProfile(tx, registryEntry.patientId, payload.billing);
    await replaceInsurancePolicies(tx, registryEntry.patientId, payload.insurancePolicies);

    return {
      patientId: registryEntry.patientId,
      mode: registryEntry.isNew ? ("created" as const) : ("linked" as const),
    };
  });
}

export async function updatePatientPersonalDetails(
  context: PatientRlsContext,
  input: PatientPersonalDetailsInput,
) {
  const resolvedContext: PatientRlsContext = {
    ...context,
    labId: context.labId,
  };

  return db.transaction(async (tx) => {
    await applyPatientRlsContext(tx, resolvedContext);

    const normalizedIdentity = normalizeIdentity({
      legalFirstName: input.legalFirstName,
      legalLastName: input.legalLastName,
      dateOfBirth: input.dateOfBirth,
      primaryPhone: input.primaryPhone,
      email: input.email,
    });

    await tx
      .update(patients)
      .set({
        legalFirstName: normalizedIdentity.trimmedFirstName,
        legalLastName: normalizedIdentity.trimmedLastName,
        dateOfBirth: normalizedIdentity.dateOfBirth,
        gender: input.gender,
        primaryPhone: normalizedIdentity.normalizedPhone,
        email: normalizedIdentity.normalizedEmail ?? null,
        primaryMedicalOfficeId: input.primaryMedicalOfficeId ?? null,
        primaryMedicalOfficeName: input.primaryMedicalOfficeName
          ? normalizeWhitespace(input.primaryMedicalOfficeName)
          : null,
        emergencyContactName: input.emergencyContactName
          ? normalizeWhitespace(input.emergencyContactName)
          : null,
        emergencyContactPhone: input.emergencyContactPhone
          ? normalizePhoneNumber(input.emergencyContactPhone)
          : null,
        emergencyContactRelationship: input.emergencyContactRelationship
          ? normalizeWhitespace(input.emergencyContactRelationship)
          : null,
        lastSeenLabId: resolvedContext.labId,
        updatedAt: new Date(),
      })
      .where(eq(patients.id, input.patientId));
  });
}

export async function updatePatientContactDetails(
  context: PatientRlsContext,
  patientId: string,
  contact: ContactDetailsInput,
) {
  return db.transaction(async (tx) => {
    await applyPatientRlsContext(tx, context);
    await upsertContactDetails(tx, patientId, contact);
  });
}

export async function updatePatientBillingPreferences(
  context: PatientRlsContext,
  patientId: string,
  billing: BillingPreferencesInput,
) {
  return db.transaction(async (tx) => {
    await applyPatientRlsContext(tx, context);
    await upsertBillingProfile(tx, patientId, billing);
  });
}

export async function replacePatientInsurancePoliciesForPatient(
  context: PatientRlsContext,
  patientId: string,
  policies: InsurancePolicyInput[],
) {
  return db.transaction(async (tx) => {
    await applyPatientRlsContext(tx, context);
    await replaceInsurancePolicies(tx, patientId, policies);
  });
}

export async function connectPatientToLab(
  context: PatientRlsContext,
  input: { patientId: string; labId: string; notes?: string | null },
) {
  const resolvedContext: PatientRlsContext = {
    ...context,
    labId: input.labId,
  };

  return db.transaction(async (tx) => {
    await applyPatientRlsContext(tx, resolvedContext);
    await ensureLabPatientProfile(tx, {
      patientId: input.patientId,
      labId: input.labId,
      connectedBy: context.userId,
      notes: input.notes,
    });
  });
}

export async function recordPatientDocument(
  context: PatientRlsContext,
  payload: PatientDocumentPayload,
) {
  return db.transaction(async (tx) => {
    await applyPatientRlsContext(tx, context);

    const inserted = await tx
      .insert(patientDocuments)
      .values({
        patientId: payload.patientId,
        documentType: payload.documentType,
        status: payload.status ?? "uploaded",
        storageDriver: payload.storageDriver,
        storageKey: payload.storageKey,
        fileName: payload.fileName,
        contentType: payload.contentType,
        fileSize: `${payload.fileSize}`,
        encryptionKeyId: payload.encryptionKeyId ?? null,
        uploadDeferred: payload.uploadDeferred ?? false,
        metadata: payload.metadata ?? null,
        uploadedBy: payload.uploadedBy,
      })
      .returning({ id: patientDocuments.id });

    return inserted[0];
  });
}

export async function getPatientProfile(
  context: PatientRlsContext,
  patientId: string,
): Promise<PatientProfileRecord | null> {
  return db.transaction(async (tx) => {
    await applyPatientRlsContext(tx, context);

    const record = await tx.query.patients.findFirst({
      where: eq(patients.id, patientId),
      with: {
        contactDetails: true,
        billingProfile: true,
        insurancePolicies: true,
        documents: {
          orderBy: (docs, { desc }) => [desc(docs.createdAt)],
        },
        labProfiles: {
          orderBy: (profile, { desc }) => [desc(profile.connectedAt)],
          with: {
            lab: true,
          },
        },
      },
    });

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      legalFirstName: record.legalFirstName,
      legalLastName: record.legalLastName,
      dateOfBirth: record.dateOfBirth,
      gender: record.gender,
      primaryPhone: record.primaryPhone,
      email: record.email,
      primaryMedicalOfficeId: record.primaryMedicalOfficeId,
      primaryMedicalOfficeName: record.primaryMedicalOfficeName,
      emergencyContactName: record.emergencyContactName,
      emergencyContactPhone: record.emergencyContactPhone,
      emergencyContactRelationship: record.emergencyContactRelationship,
      labProfiles: record.labProfiles.map((profile) => ({
        id: profile.id,
        labId: profile.labId,
        labName: profile.lab?.name ?? null,
        status: profile.status,
        internalReference: profile.internalReference ?? null,
        notes: profile.notes ?? null,
        connectedBy: profile.connectedBy ?? null,
        connectedAt: profile.connectedAt,
        lastAccessedAt: profile.lastAccessedAt,
      })),
      contact: record.contactDetails
        ? {
            streetAddress: record.contactDetails.streetAddress,
            addressLine2: record.contactDetails.addressLine2,
            city: record.contactDetails.city,
            state: record.contactDetails.state,
            postalCode: record.contactDetails.postalCode,
          }
        : null,
      billing: record.billingProfile
        ? {
            preferredPaymentMethod: record.billingProfile.preferredPaymentMethod,
            billingEmail: record.billingProfile.billingEmail,
            paperlessBillingEnabled: record.billingProfile.paperlessBillingEnabled,
            patientIsGuarantor: record.billingProfile.patientIsGuarantor,
          }
        : null,
      insurancePolicies: record.insurancePolicies.map((policy) => ({
        id: policy.id,
        insuranceProvider: policy.insuranceProvider,
        planName: policy.planName,
        policyNumber: policy.policyNumber,
        groupNumber: policy.groupNumber,
        subscriberId: policy.subscriberId,
        subscriberName: policy.subscriberName,
        subscriberRelationship: policy.subscriberRelationship,
        effectiveDate: policy.effectiveDate,
        copayAmount: policy.copayAmount,
        deductibleBalance: policy.deductibleBalance,
        medicareEligible: policy.medicareEligible,
        medicaidEligible: policy.medicaidEligible,
        metadata: (policy.metadata ?? null) as Record<string, unknown> | null,
      })),
      documents: record.documents.map((document) => ({
        id: document.id,
        patientId: document.patientId,
        documentType: document.documentType,
        status: document.status,
        storageDriver: document.storageDriver,
        storageKey: document.storageKey,
        fileName: document.fileName,
        contentType: document.contentType,
        fileSize: document.fileSize?.toString() ?? "0",
        encryptionKeyId: document.encryptionKeyId,
        uploadDeferred: document.uploadDeferred,
        metadata: (document.metadata ?? null) as Record<string, unknown> | null,
        uploadedBy: document.uploadedBy,
        uploadedAt: document.uploadedAt,
        archivedAt: document.archivedAt,
      })),
    };
  });
}

export async function getPatientDocumentById(context: PatientRlsContext, documentId: string) {
  return db.transaction(async (tx) => {
    await applyPatientRlsContext(tx, context);
    return tx.query.patientDocuments.findFirst({
      where: eq(patientDocuments.id, documentId),
    });
  });
}

export async function getActivePatientDocumentByType(
  context: PatientRlsContext,
  patientId: string,
  documentType: PatientDocumentType,
) {
  return db.transaction(async (tx) => {
    await applyPatientRlsContext(tx, context);
    return tx.query.patientDocuments.findFirst({
      where: and(
        eq(patientDocuments.patientId, patientId),
        eq(patientDocuments.documentType, documentType),
        ne(patientDocuments.status, "archived"),
      ),
      orderBy: (docs, { desc }) => [desc(docs.createdAt)],
    });
  });
}

export async function deletePatientDocumentRecord(context: PatientRlsContext, documentId: string) {
  return db.transaction(async (tx) => {
    await applyPatientRlsContext(tx, context);
    await tx.delete(patientDocuments).where(eq(patientDocuments.id, documentId));
  });
}

export async function findPatientMatches(
  context: PatientRlsContext,
  identity: PatientIdentityInput,
): Promise<PatientMatchSummary[]> {
  const normalizedIdentity = normalizeIdentity(identity);

  return db.transaction(async (tx) => {
    await applyPatientRlsContext(tx, context);

    const rows = await tx
      .select({
        patientId: patients.id,
        legalFirstName: patients.legalFirstName,
        legalLastName: patients.legalLastName,
        dateOfBirth: patients.dateOfBirth,
        primaryPhone: patients.primaryPhone,
        email: patients.email,
        labId: labPatientProfiles.labId,
        labName: authLabs.name,
        status: labPatientProfiles.status,
      })
      .from(patientRegistry)
      .innerJoin(patients, eq(patients.id, patientRegistry.id))
      .leftJoin(labPatientProfiles, eq(labPatientProfiles.patientId, patients.id))
      .leftJoin(authLabs, eq(authLabs.id, labPatientProfiles.labId))
      .where(eq(patientRegistry.identityHash, normalizedIdentity.identityHash))
      .orderBy(desc(labPatientProfiles.connectedAt));

    const grouped = new Map<string, PatientMatchSummary>();

    for (const row of rows) {
      if (!grouped.has(row.patientId)) {
        grouped.set(row.patientId, {
          patientId: row.patientId,
          legalFirstName: row.legalFirstName,
          legalLastName: row.legalLastName,
          dateOfBirth: row.dateOfBirth,
          primaryPhone: row.primaryPhone,
          email: row.email,
          labs: [],
        });
      }

      if (row.labId) {
        const entry = grouped.get(row.patientId);
        if (entry && !entry.labs.some((lab) => lab.id === row.labId)) {
          entry.labs.push({
            id: row.labId,
            name: row.labName ?? null,
            status: row.status ?? "active",
          });
        }
      }
    }

    return Array.from(grouped.values());
  });
}

export async function archivePatientDocument(
  context: PatientRlsContext,
  documentId: string,
  status: PatientDocumentStatus = "archived",
) {
  if (!PATIENT_DOCUMENT_STATUSES.includes(status)) {
    throw new Error("Unsupported document status");
  }

  return db.transaction(async (tx) => {
    await applyPatientRlsContext(tx, context);
    await tx
      .update(patientDocuments)
      .set({
        status,
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(patientDocuments.id, documentId));
  });
}

export async function updateLabPatientStatus(
  context: PatientRlsContext,
  patientId: string,
  labId: string,
  status: PatientProfileStatus,
) {
  return db.transaction(async (tx) => {
    await applyPatientRlsContext(tx, context);
    await tx
      .update(labPatientProfiles)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(and(eq(labPatientProfiles.patientId, patientId), eq(labPatientProfiles.labId, labId)));
  });
}

export async function listPatientsForLab(
  context: PatientRlsContext,
  filters: PatientListFilters,
): Promise<LabPatientListItem[]> {
  if (!filters.labId) {
    throw new Error("Lab id is required");
  }

  return db.transaction(async (tx) => {
    await applyPatientRlsContext(tx, { ...context, labId: filters.labId });

    const whereClauses: SQL<unknown>[] = [eq(labPatientProfiles.labId, filters.labId)];

    if (filters.status && filters.status.length > 0) {
      whereClauses.push(inArray(labPatientProfiles.status, filters.status));
    }

    const [first, ...rest] = whereClauses;
    let condition: SQL<unknown> = first ?? sql`1=1`;
    for (const clause of rest) {
      const nextCondition = and(condition, clause);
      condition = nextCondition ?? condition;
    }

    const query = await tx
      .select({
        patientId: patients.id,
        labId: labPatientProfiles.labId,
        labName: authLabs.name,
        legalFirstName: patients.legalFirstName,
        legalLastName: patients.legalLastName,
        dateOfBirth: patients.dateOfBirth,
        gender: patients.gender,
        primaryPhone: patients.primaryPhone,
        email: patients.email,
        primaryMedicalOfficeName: patients.primaryMedicalOfficeName,
        insuranceProviders: sql<string[]>`
          COALESCE(
            (
              SELECT array_agg(pip.insurance_provider ORDER BY pip.created_at DESC)
              FROM ${patientInsurancePolicies} AS pip
              WHERE pip.patient_id = ${patients.id}
            ),
            ARRAY[]::text[]
          )
        `,
        status: labPatientProfiles.status,
        lastAccessedAt: labPatientProfiles.lastAccessedAt,
        connectedAt: labPatientProfiles.connectedAt,
      })
      .from(labPatientProfiles)
      .innerJoin(patients, eq(patients.id, labPatientProfiles.patientId))
      .leftJoin(authLabs, eq(authLabs.id, labPatientProfiles.labId))
      .where(condition)
      .orderBy(desc(labPatientProfiles.connectedAt))
      .limit(filters.limit ?? 50);

    return query as LabPatientListItem[];
  });
}
