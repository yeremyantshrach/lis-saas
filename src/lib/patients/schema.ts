import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { labs } from "@/lib/auth/auth-schema";
import {
  PATIENT_DOCUMENT_STATUSES,
  PATIENT_DOCUMENT_TYPES,
  PATIENT_GENDERS,
  PATIENT_PAYMENT_METHODS,
  PATIENT_PROFILE_STATUSES,
} from "@/lib/patients/constants";

export const patientGenderEnum = pgEnum("patient_gender", PATIENT_GENDERS);
export const patientProfileStatusEnum = pgEnum("patient_profile_status", PATIENT_PROFILE_STATUSES);
export const patientDocumentTypeEnum = pgEnum("patient_document_type", PATIENT_DOCUMENT_TYPES);
export const patientDocumentStatusEnum = pgEnum(
  "patient_document_status",
  PATIENT_DOCUMENT_STATUSES,
);
export const patientPaymentMethodEnum = pgEnum("patient_payment_method", PATIENT_PAYMENT_METHODS);

export const patientRegistry = pgTable(
  "patient_registry",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identityHash: text("identity_hash").notNull().unique("patient_registry_identity_hash_unique"),
    primaryPhoneHash: text("primary_phone_hash").notNull(),
    emailHash: text("email_hash"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("patient_registry_phone_hash_idx").on(table.primaryPhoneHash),
    index("patient_registry_email_hash_idx").on(table.emailHash),
  ],
);

export const patients = pgTable(
  "patients",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => patientRegistry.id, { onDelete: "cascade" }),
    legalFirstName: text("legal_first_name").notNull(),
    legalLastName: text("legal_last_name").notNull(),
    dateOfBirth: date("date_of_birth", { mode: "date" }).notNull(),
    gender: patientGenderEnum("gender").notNull(),
    primaryPhone: varchar("primary_phone", { length: 32 }).notNull(),
    email: varchar("email", { length: 200 }),
    primaryMedicalOfficeId: uuid("primary_medical_office_id"),
    primaryMedicalOfficeName: text("primary_medical_office_name"),
    emergencyContactName: text("emergency_contact_name"),
    emergencyContactPhone: varchar("emergency_contact_phone", { length: 32 }),
    emergencyContactRelationship: text("emergency_contact_relationship"),
    createdBy: uuid("created_by").notNull(),
    lastSeenLabId: uuid("last_seen_lab_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    const currentUserId = sql`NULLIF(current_setting('lis.current_user_id', true), '')::uuid`;
    const activeLabId = sql`NULLIF(current_setting('lis.active_lab_id', true), '')::uuid`;
    const activeOrgId = sql`NULLIF(current_setting('lis.active_organization_id', true), '')::uuid`;
    const isGlobalAdmin = sql`COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true'`;

    const labScopedAccess = sql`
      EXISTS (
        SELECT 1
        FROM lab_patient_profiles AS profile
        WHERE profile.patient_id = ${table.id}
          AND profile.lab_id = ${activeLabId}
          AND EXISTS (
            SELECT 1
            FROM auth.lab_team_member AS ltm
            WHERE ltm.lab_id = profile.lab_id
              AND ltm.user_id = ${currentUserId}
          )
      )
    `;

    const orgOwnerAccess = sql`
      EXISTS (
        SELECT 1
        FROM auth.member AS m
        WHERE m.user_id = ${currentUserId}
          AND m.role = 'org-owner'
          AND m.organization_id = ${activeOrgId}
      )
      AND EXISTS (
        SELECT 1
        FROM lab_patient_profiles AS profile
        JOIN auth.labs AS lab ON lab.id = profile.lab_id
        WHERE profile.patient_id = ${table.id}
          AND lab.organization_id = ${activeOrgId}
      )
    `;

    const accessibleRow = sql`
      (${isGlobalAdmin})
      OR (${labScopedAccess})
      OR (${orgOwnerAccess})
    `;

    const insertCheck = sql`
      (${isGlobalAdmin})
      OR (
        ${table.lastSeenLabId} = ${activeLabId}
        AND EXISTS (
          SELECT 1
          FROM auth.lab_team_member AS ltm
          WHERE ltm.lab_id = ${activeLabId}
            AND ltm.user_id = ${currentUserId}
        )
      )
    `;

    return [
      index("patients_last_seen_lab_idx").on(table.lastSeenLabId),
      index("patients_created_by_idx").on(table.createdBy),
      pgPolicy("patients_select_policy", {
        for: "select",
        using: accessibleRow,
      }),
      pgPolicy("patients_update_policy", {
        for: "update",
        using: accessibleRow,
        withCheck: accessibleRow,
      }),
      pgPolicy("patients_delete_policy", {
        for: "delete",
        using: accessibleRow,
      }),
      pgPolicy("patients_insert_policy", {
        for: "insert",
        withCheck: insertCheck,
      }),
    ];
  },
).enableRLS();

export const patientContactDetails = pgTable(
  "patient_contact_details",
  {
    patientId: uuid("patient_id")
      .primaryKey()
      .references(() => patients.id, { onDelete: "cascade" }),
    streetAddress: text("street_address").notNull(),
    addressLine2: text("address_line_2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postalCode: text("postal_code").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    const currentUserId = sql`NULLIF(current_setting('lis.current_user_id', true), '')::uuid`;
    const activeLabId = sql`NULLIF(current_setting('lis.active_lab_id', true), '')::uuid`;
    const activeOrgId = sql`NULLIF(current_setting('lis.active_organization_id', true), '')::uuid`;
    const isGlobalAdmin = sql`COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true'`;

    const accessibleRow = sql`
      (${isGlobalAdmin})
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = ${table.patientId}
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = ${activeLabId}
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
                    AND ltm.user_id = ${currentUserId}
                )
            )
            OR (
              EXISTS (
                SELECT 1
                FROM auth.member AS m
                WHERE m.user_id = ${currentUserId}
                  AND m.role = 'org-owner'
                  AND m.organization_id = ${activeOrgId}
              )
              AND EXISTS (
                SELECT 1
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = ${activeOrgId}
              )
            )
          )
      )
    `;

    return [
      pgPolicy("patient_contact_select_policy", {
        for: "select",
        using: accessibleRow,
      }),
      pgPolicy("patient_contact_insert_policy", {
        for: "insert",
        withCheck: accessibleRow,
      }),
      pgPolicy("patient_contact_update_policy", {
        for: "update",
        using: accessibleRow,
        withCheck: accessibleRow,
      }),
      pgPolicy("patient_contact_delete_policy", {
        for: "delete",
        using: accessibleRow,
      }),
    ];
  },
).enableRLS();

export const patientBillingProfiles = pgTable(
  "patient_billing_profiles",
  {
    patientId: uuid("patient_id")
      .primaryKey()
      .references(() => patients.id, { onDelete: "cascade" }),
    preferredPaymentMethod: patientPaymentMethodEnum("preferred_payment_method"),
    billingEmail: varchar("billing_email", { length: 200 }),
    paperlessBillingEnabled: boolean("paperless_billing_enabled").notNull().default(false),
    patientIsGuarantor: boolean("patient_is_guarantor").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    const currentUserId = sql`NULLIF(current_setting('lis.current_user_id', true), '')::uuid`;
    const activeLabId = sql`NULLIF(current_setting('lis.active_lab_id', true), '')::uuid`;
    const activeOrgId = sql`NULLIF(current_setting('lis.active_organization_id', true), '')::uuid`;
    const isGlobalAdmin = sql`COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true'`;

    const accessibleRow = sql`
      (${isGlobalAdmin})
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = ${table.patientId}
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = ${activeLabId}
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
                    AND ltm.user_id = ${currentUserId}
                )
            )
            OR (
              EXISTS (
                SELECT 1
                FROM auth.member AS m
                WHERE m.user_id = ${currentUserId}
                  AND m.role = 'org-owner'
                  AND m.organization_id = ${activeOrgId}
              )
              AND EXISTS (
                SELECT 1
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = ${activeOrgId}
              )
            )
          )
      )
    `;

    return [
      pgPolicy("patient_billing_select_policy", {
        for: "select",
        using: accessibleRow,
      }),
      pgPolicy("patient_billing_insert_policy", {
        for: "insert",
        withCheck: accessibleRow,
      }),
      pgPolicy("patient_billing_update_policy", {
        for: "update",
        using: accessibleRow,
        withCheck: accessibleRow,
      }),
      pgPolicy("patient_billing_delete_policy", {
        for: "delete",
        using: accessibleRow,
      }),
    ];
  },
).enableRLS();

export const patientInsurancePolicies = pgTable(
  "patient_insurance_policies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    insuranceProvider: text("insurance_provider").notNull(),
    planName: text("plan_name"),
    policyNumber: text("policy_number"),
    groupNumber: text("group_number"),
    subscriberId: text("subscriber_id"),
    subscriberName: text("subscriber_name"),
    subscriberRelationship: text("subscriber_relationship"),
    effectiveDate: date("effective_date", { mode: "date" }),
    copayAmount: numeric("copay_amount", { precision: 10, scale: 2 }),
    deductibleBalance: numeric("deductible_balance", { precision: 10, scale: 2 }),
    medicareEligible: boolean("medicare_eligible").notNull().default(false),
    medicaidEligible: boolean("medicaid_eligible").notNull().default(false),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    const currentUserId = sql`NULLIF(current_setting('lis.current_user_id', true), '')::uuid`;
    const activeLabId = sql`NULLIF(current_setting('lis.active_lab_id', true), '')::uuid`;
    const activeOrgId = sql`NULLIF(current_setting('lis.active_organization_id', true), '')::uuid`;
    const isGlobalAdmin = sql`COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true'`;

    const accessibleRow = sql`
      (${isGlobalAdmin})
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = ${table.patientId}
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = ${activeLabId}
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
                    AND ltm.user_id = ${currentUserId}
                )
            )
            OR (
              EXISTS (
                SELECT 1
                FROM auth.member AS m
                WHERE m.user_id = ${currentUserId}
                  AND m.role = 'org-owner'
                  AND m.organization_id = ${activeOrgId}
              )
              AND EXISTS (
                SELECT 1
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = ${activeOrgId}
              )
            )
          )
      )
    `;

    return [
      index("patient_insurance_patient_idx").on(table.patientId),
      pgPolicy("patient_insurance_select_policy", {
        for: "select",
        using: accessibleRow,
      }),
      pgPolicy("patient_insurance_insert_policy", {
        for: "insert",
        withCheck: accessibleRow,
      }),
      pgPolicy("patient_insurance_update_policy", {
        for: "update",
        using: accessibleRow,
        withCheck: accessibleRow,
      }),
      pgPolicy("patient_insurance_delete_policy", {
        for: "delete",
        using: accessibleRow,
      }),
    ];
  },
).enableRLS();

export const patientDocuments = pgTable(
  "patient_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    documentType: patientDocumentTypeEnum("document_type").notNull(),
    status: patientDocumentStatusEnum("status").notNull().default("pending"),
    storageDriver: text("storage_driver").notNull(),
    storageKey: text("storage_key").notNull(),
    fileName: text("file_name").notNull(),
    contentType: text("content_type").notNull(),
    fileSize: numeric("file_size", { precision: 12, scale: 0 }).notNull(),
    encryptionKeyId: text("encryption_key_id"),
    uploadDeferred: boolean("upload_deferred").notNull().default(false),
    metadata: jsonb("metadata"),
    uploadedBy: uuid("uploaded_by"),
    uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
    archivedAt: timestamp("archived_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    const currentUserId = sql`NULLIF(current_setting('lis.current_user_id', true), '')::uuid`;
    const activeLabId = sql`NULLIF(current_setting('lis.active_lab_id', true), '')::uuid`;
    const activeOrgId = sql`NULLIF(current_setting('lis.active_organization_id', true), '')::uuid`;
    const isGlobalAdmin = sql`COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true'`;

    const accessibleRow = sql`
      (${isGlobalAdmin})
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = ${table.patientId}
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = ${activeLabId}
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
                    AND ltm.user_id = ${currentUserId}
                )
            )
            OR (
              EXISTS (
                SELECT 1
                FROM auth.member AS m
                WHERE m.user_id = ${currentUserId}
                  AND m.role = 'org-owner'
                  AND m.organization_id = ${activeOrgId}
              )
              AND EXISTS (
                SELECT 1
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = ${activeOrgId}
              )
            )
          )
      )
    `;

    return [
      index("patient_documents_patient_idx").on(table.patientId),
      pgPolicy("patient_documents_select_policy", {
        for: "select",
        using: accessibleRow,
      }),
      pgPolicy("patient_documents_insert_policy", {
        for: "insert",
        withCheck: accessibleRow,
      }),
      pgPolicy("patient_documents_update_policy", {
        for: "update",
        using: accessibleRow,
        withCheck: accessibleRow,
      }),
      pgPolicy("patient_documents_delete_policy", {
        for: "delete",
        using: accessibleRow,
      }),
    ];
  },
).enableRLS();

export const labPatientProfiles = pgTable(
  "lab_patient_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    labId: uuid("lab_id")
      .notNull()
      .references(() => labs.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    status: patientProfileStatusEnum("status").notNull().default("active"),
    internalReference: text("internal_reference"),
    notes: text("notes"),
    connectedBy: uuid("connected_by"),
    connectedAt: timestamp("connected_at").notNull().defaultNow(),
    lastAccessedAt: timestamp("last_accessed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    const currentUserId = sql`NULLIF(current_setting('lis.current_user_id', true), '')::uuid`;
    const activeLabId = sql`NULLIF(current_setting('lis.active_lab_id', true), '')::uuid`;
    const activeOrgId = sql`NULLIF(current_setting('lis.active_organization_id', true), '')::uuid`;
    const isGlobalAdmin = sql`COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true'`;

    const labScopedAccess = sql`
      ${table.labId} = ${activeLabId}
      AND EXISTS (
        SELECT 1
        FROM auth.lab_team_member AS ltm
        WHERE ltm.lab_id = ${table.labId}
          AND ltm.user_id = ${currentUserId}
      )
    `;

    const orgOwnerAccess = sql`
      EXISTS (
        SELECT 1
        FROM auth.member AS m
        WHERE m.user_id = ${currentUserId}
          AND m.role = 'org-owner'
          AND m.organization_id = ${activeOrgId}
      )
      AND EXISTS (
        SELECT 1
        FROM auth.labs AS lab
        WHERE lab.id = ${table.labId}
          AND lab.organization_id = ${activeOrgId}
      )
    `;

    const accessibleRow = sql`
      (${isGlobalAdmin})
      OR (${labScopedAccess})
      OR (${orgOwnerAccess})
    `;

    const insertCheck = sql`
      (${isGlobalAdmin})
      OR (
        ${table.labId} = ${activeLabId}
        AND EXISTS (
          SELECT 1
          FROM auth.lab_team_member AS ltm
          WHERE ltm.lab_id = ${activeLabId}
            AND ltm.user_id = ${currentUserId}
        )
      )
    `;

    return [
      index("lab_patient_profiles_lab_idx").on(table.labId),
      index("lab_patient_profiles_patient_idx").on(table.patientId),
      uniqueIndex("lab_patient_profiles_lab_patient_unique").on(table.labId, table.patientId),
      pgPolicy("lab_patient_profiles_select_policy", {
        for: "select",
        using: accessibleRow,
      }),
      pgPolicy("lab_patient_profiles_insert_policy", {
        for: "insert",
        withCheck: insertCheck,
      }),
      pgPolicy("lab_patient_profiles_update_policy", {
        for: "update",
        using: accessibleRow,
        withCheck: accessibleRow,
      }),
      pgPolicy("lab_patient_profiles_delete_policy", {
        for: "delete",
        using: accessibleRow,
      }),
    ];
  },
).enableRLS();
