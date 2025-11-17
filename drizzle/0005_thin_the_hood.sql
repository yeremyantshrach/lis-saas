DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_enum e
    JOIN pg_catalog.pg_type t ON e.enumtypid = t.oid
    JOIN pg_catalog.pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'organization_role_enum'
      AND n.nspname = 'auth'
      AND e.enumlabel = 'doctor'
  ) THEN
    EXECUTE 'ALTER TYPE auth.organization_role_enum RENAME VALUE ''doctor'' TO ''client-doctor''';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_enum e
    JOIN pg_catalog.pg_type t ON e.enumtypid = t.oid
    JOIN pg_catalog.pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'organization_role_enum'
      AND n.nspname = 'auth'
      AND e.enumlabel = 'receptionist'
  ) THEN
    EXECUTE 'ALTER TYPE auth.organization_role_enum RENAME VALUE ''receptionist'' TO ''client-assistant''';
  END IF;
END $$;
