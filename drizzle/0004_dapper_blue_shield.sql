CREATE TYPE "public"."patient_document_status" AS ENUM('pending', 'uploaded', 'failed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."patient_document_type" AS ENUM('government_id', 'insurance_card', 'other');--> statement-breakpoint
CREATE TYPE "public"."patient_gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."patient_payment_method" AS ENUM('insurance', 'self_pay', 'medicare', 'medicaid', 'other');--> statement-breakpoint
CREATE TYPE "public"."patient_profile_status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
CREATE TABLE "lab_patient_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"status" "patient_profile_status" DEFAULT 'active' NOT NULL,
	"internal_reference" text,
	"notes" text,
	"connected_by" uuid,
	"connected_at" timestamp DEFAULT now() NOT NULL,
	"last_accessed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lab_patient_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "patient_billing_profiles" (
	"patient_id" uuid PRIMARY KEY NOT NULL,
	"preferred_payment_method" "patient_payment_method",
	"billing_email" varchar(200),
	"paperless_billing_enabled" boolean DEFAULT false NOT NULL,
	"patient_is_guarantor" boolean DEFAULT true NOT NULL,
	"guarantor_name" text,
	"guarantor_phone" varchar(32),
	"guarantor_relationship" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patient_billing_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "patient_contact_details" (
	"patient_id" uuid PRIMARY KEY NOT NULL,
	"street_address" text NOT NULL,
	"address_line_2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"postal_code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patient_contact_details" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "patient_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"document_type" "patient_document_type" NOT NULL,
	"status" "patient_document_status" DEFAULT 'pending' NOT NULL,
	"storage_driver" text NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"file_size" numeric(12, 0) NOT NULL,
	"encryption_key_id" text,
	"upload_deferred" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"uploaded_by" uuid,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patient_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "patient_insurance_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"insurance_provider" text NOT NULL,
	"plan_name" text,
	"policy_number" text,
	"group_number" text,
	"subscriber_id" text,
	"subscriber_name" text,
	"subscriber_relationship" text,
	"effective_date" date,
	"copay_amount" numeric(10, 2),
	"deductible_balance" numeric(10, 2),
	"medicare_eligible" boolean DEFAULT false NOT NULL,
	"medicaid_eligible" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patient_insurance_policies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "patient_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_hash" text NOT NULL,
	"primary_phone_hash" text NOT NULL,
	"email_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "patient_registry_identity_hash_unique" UNIQUE("identity_hash")
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY NOT NULL,
	"legal_first_name" text NOT NULL,
	"legal_last_name" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"gender" "patient_gender" NOT NULL,
	"primary_phone" varchar(32) NOT NULL,
	"email" varchar(200),
	"primary_medical_office_id" uuid,
	"primary_medical_office_name" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" varchar(32),
	"emergency_contact_relationship" text,
	"created_by" uuid NOT NULL,
	"last_seen_lab_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lab_patient_profiles" ADD CONSTRAINT "lab_patient_profiles_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "auth"."labs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_patient_profiles" ADD CONSTRAINT "lab_patient_profiles_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_billing_profiles" ADD CONSTRAINT "patient_billing_profiles_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_contact_details" ADD CONSTRAINT "patient_contact_details_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_documents" ADD CONSTRAINT "patient_documents_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_insurance_policies" ADD CONSTRAINT "patient_insurance_policies_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_id_patient_registry_id_fk" FOREIGN KEY ("id") REFERENCES "public"."patient_registry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lab_patient_profiles_lab_idx" ON "lab_patient_profiles" USING btree ("lab_id");--> statement-breakpoint
CREATE INDEX "lab_patient_profiles_patient_idx" ON "lab_patient_profiles" USING btree ("patient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lab_patient_profiles_lab_patient_unique" ON "lab_patient_profiles" USING btree ("lab_id","patient_id");--> statement-breakpoint
CREATE INDEX "patient_documents_patient_idx" ON "patient_documents" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "patient_insurance_patient_idx" ON "patient_insurance_policies" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "patient_registry_phone_hash_idx" ON "patient_registry" USING btree ("primary_phone_hash");--> statement-breakpoint
CREATE INDEX "patient_registry_email_hash_idx" ON "patient_registry" USING btree ("email_hash");--> statement-breakpoint
CREATE INDEX "patients_last_seen_lab_idx" ON "patients" USING btree ("last_seen_lab_id");--> statement-breakpoint
CREATE INDEX "patients_created_by_idx" ON "patients" USING btree ("created_by");--> statement-breakpoint
CREATE POLICY "lab_patient_profiles_select_policy" ON "lab_patient_profiles" AS PERMISSIVE FOR SELECT TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR (
      "lab_patient_profiles"."lab_id" = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
      AND EXISTS (
        SELECT 1
        FROM auth.lab_team_member AS ltm
        WHERE ltm.lab_id = "lab_patient_profiles"."lab_id"
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
        FROM auth.labs AS lab
        WHERE lab.id = "lab_patient_profiles"."lab_id"
          AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
    )
    );--> statement-breakpoint
CREATE POLICY "lab_patient_profiles_insert_policy" ON "lab_patient_profiles" AS PERMISSIVE FOR INSERT TO public WITH CHECK (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR (
        "lab_patient_profiles"."lab_id" = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
        AND EXISTS (
          SELECT 1
          FROM auth.lab_team_member AS ltm
          WHERE ltm.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
            AND ltm.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
        )
      )
    );--> statement-breakpoint
CREATE POLICY "lab_patient_profiles_update_policy" ON "lab_patient_profiles" AS PERMISSIVE FOR UPDATE TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR (
      "lab_patient_profiles"."lab_id" = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
      AND EXISTS (
        SELECT 1
        FROM auth.lab_team_member AS ltm
        WHERE ltm.lab_id = "lab_patient_profiles"."lab_id"
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
        FROM auth.labs AS lab
        WHERE lab.id = "lab_patient_profiles"."lab_id"
          AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
    )
    ) WITH CHECK (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR (
      "lab_patient_profiles"."lab_id" = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
      AND EXISTS (
        SELECT 1
        FROM auth.lab_team_member AS ltm
        WHERE ltm.lab_id = "lab_patient_profiles"."lab_id"
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
        FROM auth.labs AS lab
        WHERE lab.id = "lab_patient_profiles"."lab_id"
          AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
    )
    );--> statement-breakpoint
CREATE POLICY "lab_patient_profiles_delete_policy" ON "lab_patient_profiles" AS PERMISSIVE FOR DELETE TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR (
      "lab_patient_profiles"."lab_id" = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
      AND EXISTS (
        SELECT 1
        FROM auth.lab_team_member AS ltm
        WHERE ltm.lab_id = "lab_patient_profiles"."lab_id"
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
        FROM auth.labs AS lab
        WHERE lab.id = "lab_patient_profiles"."lab_id"
          AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
    )
    );--> statement-breakpoint
CREATE POLICY "patient_billing_select_policy" ON "patient_billing_profiles" AS PERMISSIVE FOR SELECT TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = "patient_billing_profiles"."patient_id"
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
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
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    );--> statement-breakpoint
CREATE POLICY "patient_billing_insert_policy" ON "patient_billing_profiles" AS PERMISSIVE FOR INSERT TO public WITH CHECK (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = "patient_billing_profiles"."patient_id"
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
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
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    );--> statement-breakpoint
CREATE POLICY "patient_billing_update_policy" ON "patient_billing_profiles" AS PERMISSIVE FOR UPDATE TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = "patient_billing_profiles"."patient_id"
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
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
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    ) WITH CHECK (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = "patient_billing_profiles"."patient_id"
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
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
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    );--> statement-breakpoint
CREATE POLICY "patient_billing_delete_policy" ON "patient_billing_profiles" AS PERMISSIVE FOR DELETE TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = "patient_billing_profiles"."patient_id"
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
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
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    );--> statement-breakpoint
CREATE POLICY "patient_contact_select_policy" ON "patient_contact_details" AS PERMISSIVE FOR SELECT TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = "patient_contact_details"."patient_id"
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
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
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    );--> statement-breakpoint
CREATE POLICY "patient_contact_insert_policy" ON "patient_contact_details" AS PERMISSIVE FOR INSERT TO public WITH CHECK (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = "patient_contact_details"."patient_id"
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
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
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    );--> statement-breakpoint
CREATE POLICY "patient_contact_update_policy" ON "patient_contact_details" AS PERMISSIVE FOR UPDATE TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = "patient_contact_details"."patient_id"
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
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
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    ) WITH CHECK (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = "patient_contact_details"."patient_id"
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
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
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    );--> statement-breakpoint
CREATE POLICY "patient_contact_delete_policy" ON "patient_contact_details" AS PERMISSIVE FOR DELETE TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = "patient_contact_details"."patient_id"
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
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
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    );--> statement-breakpoint
CREATE POLICY "patient_documents_select_policy" ON "patient_documents" AS PERMISSIVE FOR SELECT TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = "patient_documents"."patient_id"
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
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
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    );--> statement-breakpoint
CREATE POLICY "patient_documents_insert_policy" ON "patient_documents" AS PERMISSIVE FOR INSERT TO public WITH CHECK (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = "patient_documents"."patient_id"
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
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
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    );--> statement-breakpoint
CREATE POLICY "patient_documents_update_policy" ON "patient_documents" AS PERMISSIVE FOR UPDATE TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = "patient_documents"."patient_id"
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
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
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    ) WITH CHECK (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = "patient_documents"."patient_id"
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
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
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    );--> statement-breakpoint
CREATE POLICY "patient_documents_delete_policy" ON "patient_documents" AS PERMISSIVE FOR DELETE TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = "patient_documents"."patient_id"
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
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
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    );--> statement-breakpoint
CREATE POLICY "patient_insurance_select_policy" ON "patient_insurance_policies" AS PERMISSIVE FOR SELECT TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = "patient_insurance_policies"."patient_id"
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
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
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    );--> statement-breakpoint
CREATE POLICY "patient_insurance_insert_policy" ON "patient_insurance_policies" AS PERMISSIVE FOR INSERT TO public WITH CHECK (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = "patient_insurance_policies"."patient_id"
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
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
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    );--> statement-breakpoint
CREATE POLICY "patient_insurance_update_policy" ON "patient_insurance_policies" AS PERMISSIVE FOR UPDATE TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = "patient_insurance_policies"."patient_id"
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
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
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    ) WITH CHECK (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = "patient_insurance_policies"."patient_id"
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
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
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    );--> statement-breakpoint
CREATE POLICY "patient_insurance_delete_policy" ON "patient_insurance_policies" AS PERMISSIVE FOR DELETE TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
        SELECT 1
        FROM patients AS p
        WHERE p.id = "patient_insurance_policies"."patient_id"
          AND (
            EXISTS (
              SELECT 1
              FROM lab_patient_profiles AS profile
              WHERE profile.patient_id = p.id
                AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
                AND EXISTS (
                  SELECT 1
                  FROM auth.lab_team_member AS ltm
                  WHERE ltm.lab_id = profile.lab_id
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
                FROM lab_patient_profiles AS profile
                JOIN auth.labs AS lab ON lab.id = profile.lab_id
                WHERE profile.patient_id = p.id
                  AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
              )
            )
          )
      )
    );--> statement-breakpoint
CREATE POLICY "patients_select_policy" ON "patients" AS PERMISSIVE FOR SELECT TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR (
      EXISTS (
        SELECT 1
        FROM lab_patient_profiles AS profile
        WHERE profile.patient_id = "patients"."id"
          AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
          AND EXISTS (
            SELECT 1
            FROM auth.lab_team_member AS ltm
            WHERE ltm.lab_id = profile.lab_id
              AND ltm.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
          )
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
        FROM lab_patient_profiles AS profile
        JOIN auth.labs AS lab ON lab.id = profile.lab_id
        WHERE profile.patient_id = "patients"."id"
          AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
    )
    );--> statement-breakpoint
CREATE POLICY "patients_update_policy" ON "patients" AS PERMISSIVE FOR UPDATE TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR (
      EXISTS (
        SELECT 1
        FROM lab_patient_profiles AS profile
        WHERE profile.patient_id = "patients"."id"
          AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
          AND EXISTS (
            SELECT 1
            FROM auth.lab_team_member AS ltm
            WHERE ltm.lab_id = profile.lab_id
              AND ltm.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
          )
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
        FROM lab_patient_profiles AS profile
        JOIN auth.labs AS lab ON lab.id = profile.lab_id
        WHERE profile.patient_id = "patients"."id"
          AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
    )
    ) WITH CHECK (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR (
      EXISTS (
        SELECT 1
        FROM lab_patient_profiles AS profile
        WHERE profile.patient_id = "patients"."id"
          AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
          AND EXISTS (
            SELECT 1
            FROM auth.lab_team_member AS ltm
            WHERE ltm.lab_id = profile.lab_id
              AND ltm.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
          )
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
        FROM lab_patient_profiles AS profile
        JOIN auth.labs AS lab ON lab.id = profile.lab_id
        WHERE profile.patient_id = "patients"."id"
          AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
    )
    );--> statement-breakpoint
CREATE POLICY "patients_delete_policy" ON "patients" AS PERMISSIVE FOR DELETE TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR (
      EXISTS (
        SELECT 1
        FROM lab_patient_profiles AS profile
        WHERE profile.patient_id = "patients"."id"
          AND profile.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
          AND EXISTS (
            SELECT 1
            FROM auth.lab_team_member AS ltm
            WHERE ltm.lab_id = profile.lab_id
              AND ltm.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
          )
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
        FROM lab_patient_profiles AS profile
        JOIN auth.labs AS lab ON lab.id = profile.lab_id
        WHERE profile.patient_id = "patients"."id"
          AND lab.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
    )
    );--> statement-breakpoint
CREATE POLICY "patients_insert_policy" ON "patients" AS PERMISSIVE FOR INSERT TO public WITH CHECK (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR (
        "patients"."last_seen_lab_id" = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
        AND EXISTS (
          SELECT 1
          FROM auth.lab_team_member AS ltm
          WHERE ltm.lab_id = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
            AND ltm.user_id = NULLIF(current_setting('lis.current_user_id', true), '')::uuid
        )
      )
    );