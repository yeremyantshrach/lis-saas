ALTER POLICY "lab_test_pcr_details_select_policy" ON "lab_test_pcr_details" TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
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
ALTER POLICY "lab_test_pcr_details_insert_policy" ON "lab_test_pcr_details" TO public WITH CHECK (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
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
ALTER POLICY "lab_test_pcr_details_update_policy" ON "lab_test_pcr_details" TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
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
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
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
ALTER POLICY "lab_test_pcr_details_delete_policy" ON "lab_test_pcr_details" TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR EXISTS (
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
ALTER POLICY "lab_tests_select_policy" ON "lab_tests" TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR (
      "lab_tests"."lab_id" = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
      AND EXISTS (
        SELECT 1
        FROM auth.lab_team_member AS ltm
        WHERE ltm.lab_id = "lab_tests"."lab_id"
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
        WHERE l.id = "lab_tests"."lab_id"
          AND l.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
    )
    );--> statement-breakpoint
ALTER POLICY "lab_tests_insert_policy" ON "lab_tests" TO public WITH CHECK (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR (
      "lab_tests"."lab_id" = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
      AND EXISTS (
        SELECT 1
        FROM auth.lab_team_member AS ltm
        WHERE ltm.lab_id = "lab_tests"."lab_id"
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
        WHERE l.id = "lab_tests"."lab_id"
          AND l.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
    )
    );--> statement-breakpoint
ALTER POLICY "lab_tests_update_policy" ON "lab_tests" TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR (
      "lab_tests"."lab_id" = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
      AND EXISTS (
        SELECT 1
        FROM auth.lab_team_member AS ltm
        WHERE ltm.lab_id = "lab_tests"."lab_id"
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
        WHERE l.id = "lab_tests"."lab_id"
          AND l.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
    )
    ) WITH CHECK (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR (
      "lab_tests"."lab_id" = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
      AND EXISTS (
        SELECT 1
        FROM auth.lab_team_member AS ltm
        WHERE ltm.lab_id = "lab_tests"."lab_id"
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
        WHERE l.id = "lab_tests"."lab_id"
          AND l.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
    )
    );--> statement-breakpoint
ALTER POLICY "lab_tests_delete_policy" ON "lab_tests" TO public USING (
      (COALESCE(current_setting('lis.is_global_admin', true), 'false') = 'true')
      OR (
      "lab_tests"."lab_id" = NULLIF(current_setting('lis.active_lab_id', true), '')::uuid
      AND EXISTS (
        SELECT 1
        FROM auth.lab_team_member AS ltm
        WHERE ltm.lab_id = "lab_tests"."lab_id"
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
        WHERE l.id = "lab_tests"."lab_id"
          AND l.organization_id = NULLIF(current_setting('lis.active_organization_id', true), '')::uuid
      )
    )
    );