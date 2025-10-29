CREATE TYPE "public"."lab_test_panel" AS ENUM('Respiratory', 'Pneumonia', 'Gastrointestinal (GI)', 'Blood Culture', 'Meningitis / Encephalitis', 'STI', 'Nail / Fungal', 'UTI', 'Wound / Tissue', 'Women''s Health', 'Antimicrobial Resistance', 'COVID/Flu/RSV');--> statement-breakpoint
CREATE TYPE "public"."lab_test_sample_type" AS ENUM('Nasopharyngeal Swab', 'Oropharyngeal Swab', 'Sputum', 'Stool', 'Urine', 'Vaginal Swab', 'Cervical Swab', 'Whole Blood', 'Plasma', 'Serum', 'Cerebrospinal Fluid (CSF)', 'Tissue Biopsy', 'Wound Swab', 'Nail Clipping', 'Skin Scrapings');--> statement-breakpoint
CREATE TYPE "public"."lab_test_type" AS ENUM('PCR');--> statement-breakpoint
CREATE TABLE "lab_test_pcr_details" (
	"lab_test_id" uuid PRIMARY KEY NOT NULL,
	"panel" "lab_test_panel" NOT NULL,
	"sample_type" "lab_test_sample_type" NOT NULL,
	"pathogen_targets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"resistance_markers" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lab_test_pcr_details" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "lab_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_id" uuid NOT NULL,
	"type" "lab_test_type" DEFAULT 'PCR' NOT NULL,
	"test_code" varchar(16) NOT NULL,
	"test_name" varchar(100) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"loinc_code" varchar(10),
	"cpt_code" varchar(5),
	"description" varchar(500),
	"default_clinical_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "lab_tests_test_code_unique" UNIQUE("test_code"),
	CONSTRAINT "lab_tests_test_code_format" CHECK ("lab_tests"."test_code" ~ '^PCR-[0-9]{3}-[0-9]{2}$'),
	CONSTRAINT "lab_tests_loinc_format" CHECK ("lab_tests"."loinc_code" IS NULL OR "lab_tests"."loinc_code" ~ '^[0-9]{5}-[0-9]$'),
	CONSTRAINT "lab_tests_cpt_format" CHECK ("lab_tests"."cpt_code" IS NULL OR "lab_tests"."cpt_code" ~ '^[0-9]{5}$'),
	CONSTRAINT "lab_tests_price_positive" CHECK ("lab_tests"."price" >= 0)
);
--> statement-breakpoint
ALTER TABLE "lab_tests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lab_test_pcr_details" ADD CONSTRAINT "lab_test_pcr_details_lab_test_id_lab_tests_id_fk" FOREIGN KEY ("lab_test_id") REFERENCES "public"."lab_tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_tests" ADD CONSTRAINT "lab_tests_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "auth"."labs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lab_test_pcr_details_panel_idx" ON "lab_test_pcr_details" USING btree ("panel");--> statement-breakpoint
CREATE INDEX "lab_test_pcr_details_sample_type_idx" ON "lab_test_pcr_details" USING btree ("sample_type");--> statement-breakpoint
CREATE INDEX "lab_tests_lab_idx" ON "lab_tests" USING btree ("lab_id");--> statement-breakpoint
CREATE POLICY "lab_test_pcr_details_select_policy" ON "lab_test_pcr_details" AS PERMISSIVE FOR SELECT TO public USING (
      EXISTS (
        SELECT 1
        FROM lab_tests AS parent
        WHERE parent.id = "lab_test_pcr_details"."lab_test_id"
          AND (
            (
              parent.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
              AND EXISTS (
                SELECT 1
                FROM auth.lab_team_member AS ltm
                WHERE ltm.lab_id = parent.lab_id
                  AND ltm.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
              )
            )
            OR (
              EXISTS (
                SELECT 1
                FROM auth.member AS m
                WHERE m.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
                  AND m.role = 'org-owner'
                  AND m.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
              AND EXISTS (
                SELECT 1
                FROM auth.labs AS l
                WHERE l.id = parent.lab_id
                  AND l.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    );--> statement-breakpoint
CREATE POLICY "lab_test_pcr_details_insert_policy" ON "lab_test_pcr_details" AS PERMISSIVE FOR INSERT TO public WITH CHECK (
      EXISTS (
        SELECT 1
        FROM lab_tests AS parent
        WHERE parent.id = "lab_test_pcr_details"."lab_test_id"
          AND (
            (
              parent.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
              AND EXISTS (
                SELECT 1
                FROM auth.lab_team_member AS ltm
                WHERE ltm.lab_id = parent.lab_id
                  AND ltm.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
              )
            )
            OR (
              EXISTS (
                SELECT 1
                FROM auth.member AS m
                WHERE m.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
                  AND m.role = 'org-owner'
                  AND m.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
              AND EXISTS (
                SELECT 1
                FROM auth.labs AS l
                WHERE l.id = parent.lab_id
                  AND l.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    );--> statement-breakpoint
CREATE POLICY "lab_test_pcr_details_update_policy" ON "lab_test_pcr_details" AS PERMISSIVE FOR UPDATE TO public USING (
      EXISTS (
        SELECT 1
        FROM lab_tests AS parent
        WHERE parent.id = "lab_test_pcr_details"."lab_test_id"
          AND (
            (
              parent.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
              AND EXISTS (
                SELECT 1
                FROM auth.lab_team_member AS ltm
                WHERE ltm.lab_id = parent.lab_id
                  AND ltm.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
              )
            )
            OR (
              EXISTS (
                SELECT 1
                FROM auth.member AS m
                WHERE m.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
                  AND m.role = 'org-owner'
                  AND m.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
              AND EXISTS (
                SELECT 1
                FROM auth.labs AS l
                WHERE l.id = parent.lab_id
                  AND l.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1
        FROM lab_tests AS parent
        WHERE parent.id = "lab_test_pcr_details"."lab_test_id"
          AND (
            (
              parent.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
              AND EXISTS (
                SELECT 1
                FROM auth.lab_team_member AS ltm
                WHERE ltm.lab_id = parent.lab_id
                  AND ltm.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
              )
            )
            OR (
              EXISTS (
                SELECT 1
                FROM auth.member AS m
                WHERE m.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
                  AND m.role = 'org-owner'
                  AND m.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
              AND EXISTS (
                SELECT 1
                FROM auth.labs AS l
                WHERE l.id = parent.lab_id
                  AND l.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    );--> statement-breakpoint
CREATE POLICY "lab_test_pcr_details_delete_policy" ON "lab_test_pcr_details" AS PERMISSIVE FOR DELETE TO public USING (
      EXISTS (
        SELECT 1
        FROM lab_tests AS parent
        WHERE parent.id = "lab_test_pcr_details"."lab_test_id"
          AND (
            (
              parent.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
              AND EXISTS (
                SELECT 1
                FROM auth.lab_team_member AS ltm
                WHERE ltm.lab_id = parent.lab_id
                  AND ltm.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
              )
            )
            OR (
              EXISTS (
                SELECT 1
                FROM auth.member AS m
                WHERE m.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
                  AND m.role = 'org-owner'
                  AND m.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
              AND EXISTS (
                SELECT 1
                FROM auth.labs AS l
                WHERE l.id = parent.lab_id
                  AND l.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    );--> statement-breakpoint
CREATE POLICY "lab_tests_select_policy" ON "lab_tests" AS PERMISSIVE FOR SELECT TO public USING ((
      "lab_tests"."lab_id" = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
      AND EXISTS (
        SELECT 1
        FROM auth.lab_team_member AS ltm
        WHERE ltm.lab_id = "lab_tests"."lab_id"
          AND ltm.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
      )
    ) OR (
      EXISTS (
        SELECT 1
        FROM auth.member AS m
        WHERE m.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
          AND m.role = 'org-owner'
          AND m.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
      AND EXISTS (
        SELECT 1
        FROM auth.labs AS l
        WHERE l.id = "lab_tests"."lab_id"
          AND l.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
    ));--> statement-breakpoint
CREATE POLICY "lab_tests_insert_policy" ON "lab_tests" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((
      "lab_tests"."lab_id" = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
      AND EXISTS (
        SELECT 1
        FROM auth.lab_team_member AS ltm
        WHERE ltm.lab_id = "lab_tests"."lab_id"
          AND ltm.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
      )
    ) OR (
      EXISTS (
        SELECT 1
        FROM auth.member AS m
        WHERE m.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
          AND m.role = 'org-owner'
          AND m.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
      AND EXISTS (
        SELECT 1
        FROM auth.labs AS l
        WHERE l.id = "lab_tests"."lab_id"
          AND l.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
    ));--> statement-breakpoint
CREATE POLICY "lab_tests_update_policy" ON "lab_tests" AS PERMISSIVE FOR UPDATE TO public USING ((
      "lab_tests"."lab_id" = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
      AND EXISTS (
        SELECT 1
        FROM auth.lab_team_member AS ltm
        WHERE ltm.lab_id = "lab_tests"."lab_id"
          AND ltm.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
      )
    ) OR (
      EXISTS (
        SELECT 1
        FROM auth.member AS m
        WHERE m.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
          AND m.role = 'org-owner'
          AND m.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
      AND EXISTS (
        SELECT 1
        FROM auth.labs AS l
        WHERE l.id = "lab_tests"."lab_id"
          AND l.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
    )) WITH CHECK ((
      "lab_tests"."lab_id" = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
      AND EXISTS (
        SELECT 1
        FROM auth.lab_team_member AS ltm
        WHERE ltm.lab_id = "lab_tests"."lab_id"
          AND ltm.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
      )
    ) OR (
      EXISTS (
        SELECT 1
        FROM auth.member AS m
        WHERE m.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
          AND m.role = 'org-owner'
          AND m.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
      AND EXISTS (
        SELECT 1
        FROM auth.labs AS l
        WHERE l.id = "lab_tests"."lab_id"
          AND l.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
    ));--> statement-breakpoint
CREATE POLICY "lab_tests_delete_policy" ON "lab_tests" AS PERMISSIVE FOR DELETE TO public USING ((
      "lab_tests"."lab_id" = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
      AND EXISTS (
        SELECT 1
        FROM auth.lab_team_member AS ltm
        WHERE ltm.lab_id = "lab_tests"."lab_id"
          AND ltm.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
      )
    ) OR (
      EXISTS (
        SELECT 1
        FROM auth.member AS m
        WHERE m.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
          AND m.role = 'org-owner'
          AND m.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
      AND EXISTS (
        SELECT 1
        FROM auth.labs AS l
        WHERE l.id = "lab_tests"."lab_id"
          AND l.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
    ));