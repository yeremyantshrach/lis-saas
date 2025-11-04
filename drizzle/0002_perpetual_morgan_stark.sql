DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_enum e
    JOIN pg_catalog.pg_type t ON e.enumtypid = t.oid
    JOIN pg_catalog.pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'organization_role_enum'
      AND n.nspname = 'auth'
      AND e.enumlabel = 'lab-doctor'
  ) THEN
    EXECUTE 'ALTER TYPE auth.organization_role_enum RENAME VALUE ''lab-doctor'' TO ''doctor''';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_enum e
    JOIN pg_catalog.pg_type t ON e.enumtypid = t.oid
    JOIN pg_catalog.pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'organization_role_enum'
      AND n.nspname = 'auth'
      AND e.enumlabel = 'lab-receptionist'
  ) THEN
    EXECUTE 'ALTER TYPE auth.organization_role_enum RENAME VALUE ''lab-receptionist'' TO ''receptionist''';
  END IF;
END $$;
