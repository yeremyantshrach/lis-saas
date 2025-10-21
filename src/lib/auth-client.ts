import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { adminClient, organizationClient } from "better-auth/client/plugins";
import { adminAccessControl, admin, support } from "@/lib/auth/admin-permissions";
import {
  labAdmin,
  labCls,
  labDoctor,
  labReceptionist,
  labTech,
  organizationAccessControl,
  orgOwner,
} from "@/lib/auth/organization-permissions";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac: adminAccessControl,
      roles: {
        admin,
        support,
      },
    }),
    organizationClient({
      ac: organizationAccessControl,
      roles: {
        orgOwner,
        labCls,
        labAdmin,
        labDoctor,
        labTech,
        labReceptionist,
      },
      teams: {
        enabled: true,
      },
    }),
    inferAdditionalFields<typeof auth>(),
  ],
});

export type Session = typeof authClient.$Infer.Session;
