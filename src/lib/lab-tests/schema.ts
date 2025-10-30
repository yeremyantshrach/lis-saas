import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { labs } from "@/lib/auth/auth-schema";
import {
  LAB_TEST_TYPES,
  PCR_SAMPLE_TYPES,
  PCR_TEST_PANELS,
  type PcrPathogenTarget,
  type PcrResistanceMarker,
} from "@/lib/lab-tests/constants";

export const labTestTypeEnum = pgEnum("lab_test_type", LAB_TEST_TYPES);

export const labTestPanelEnum = pgEnum("lab_test_panel", PCR_TEST_PANELS);

export const labTestSampleTypeEnum = pgEnum("lab_test_sample_type", PCR_SAMPLE_TYPES);

export const labTests = pgTable(
  "lab_tests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    labId: uuid("lab_id")
      .notNull()
      .references(() => labs.id, { onDelete: "cascade" }),
    type: labTestTypeEnum("type").notNull().default("PCR"),
    testCode: varchar("test_code", { length: 16 }).notNull().unique("lab_tests_test_code_unique"),
    testName: varchar("test_name", { length: 100 }).notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    loincCode: varchar("loinc_code", { length: 10 }),
    cptCode: varchar("cpt_code", { length: 5 }),
    description: varchar("description", { length: 500 }),
    defaultClinicalNotes: text("default_clinical_notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    // These session variables must be set on the connection before querying lab test tables.
    const currentUserId = sql`NULLIF(current_setting('lis.current_user_id', true), '')::uuid`;
    const activeLabId = sql`NULLIF(current_setting('lis.active_lab_id', true), '')::uuid`;
    const activeOrgId = sql`NULLIF(current_setting('lis.active_organization_id', true), '')::uuid`;

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
        FROM auth.labs AS l
        WHERE l.id = ${table.labId}
          AND l.organization_id = ${activeOrgId}
      )
    `;

    const accessibleRow = sql`(${labScopedAccess}) OR (${orgOwnerAccess})`;

    return [
      index("lab_tests_lab_idx").on(table.labId),
      check("lab_tests_test_code_format", sql`${table.testCode} ~ '^PCR-[0-9]{3}-[0-9]{2}$'`),
      check(
        "lab_tests_loinc_format",
        sql`${table.loincCode} IS NULL OR ${table.loincCode} ~ '^[0-9]{5}-[0-9]$'`,
      ),
      check(
        "lab_tests_cpt_format",
        sql`${table.cptCode} IS NULL OR ${table.cptCode} ~ '^[0-9]{5}$'`,
      ),
      check("lab_tests_price_positive", sql`${table.price} >= 0`),
      pgPolicy("lab_tests_select_policy", {
        for: "select",
        using: accessibleRow,
      }),
      pgPolicy("lab_tests_insert_policy", {
        for: "insert",
        withCheck: accessibleRow,
      }),
      pgPolicy("lab_tests_update_policy", {
        for: "update",
        using: accessibleRow,
        withCheck: accessibleRow,
      }),
      pgPolicy("lab_tests_delete_policy", {
        for: "delete",
        using: accessibleRow,
      }),
    ];
  },
).enableRLS();

export const labTestPcrDetails = pgTable(
  "lab_test_pcr_details",
  {
    labTestId: uuid("lab_test_id")
      .primaryKey()
      .references(() => labTests.id, { onDelete: "cascade" }),
    panel: labTestPanelEnum("panel").notNull(),
    sampleType: labTestSampleTypeEnum("sample_type").notNull(),
    pathogenTargets: jsonb("pathogen_targets")
      .$type<PcrPathogenTarget[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    resistanceMarkers: jsonb("resistance_markers")
      .$type<PcrResistanceMarker[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
  },
  (table) => {
    const currentUserId = sql`NULLIF(current_setting('lis.current_user_id', true), '')::uuid`;
    const activeLabId = sql`NULLIF(current_setting('lis.active_lab_id', true), '')::uuid`;
    const activeOrgId = sql`NULLIF(current_setting('lis.active_organization_id', true), '')::uuid`;

    const accessibleRow = sql`
      EXISTS (
        SELECT 1
        FROM lab_tests AS parent
        WHERE parent.id = ${table.labTestId}
          AND (
            (
              parent.lab_id = ${activeLabId}
              AND EXISTS (
                SELECT 1
                FROM auth.lab_team_member AS ltm
                WHERE ltm.lab_id = parent.lab_id
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
                FROM auth.labs AS l
                WHERE l.id = parent.lab_id
                  AND l.organization_id = ${activeOrgId}
              )
            )
          )
      )
    `;

    return [
      index("lab_test_pcr_details_panel_idx").on(table.panel),
      index("lab_test_pcr_details_sample_type_idx").on(table.sampleType),
      pgPolicy("lab_test_pcr_details_select_policy", {
        for: "select",
        using: accessibleRow,
      }),
      pgPolicy("lab_test_pcr_details_insert_policy", {
        for: "insert",
        withCheck: accessibleRow,
      }),
      pgPolicy("lab_test_pcr_details_update_policy", {
        for: "update",
        using: accessibleRow,
        withCheck: accessibleRow,
      }),
      pgPolicy("lab_test_pcr_details_delete_policy", {
        for: "delete",
        using: accessibleRow,
      }),
    ];
  },
).enableRLS();

export type LabTest = typeof labTests.$inferSelect;
export type NewLabTest = typeof labTests.$inferInsert;
export type LabTestPcrDetails = typeof labTestPcrDetails.$inferSelect;
export type NewLabTestPcrDetails = typeof labTestPcrDetails.$inferInsert;
