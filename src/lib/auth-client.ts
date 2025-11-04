import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, customSessionClient } from "better-auth/client/plugins";
import { adminClient, organizationClient } from "better-auth/client/plugins";
import { adminAccessControl, admin, support } from "@/lib/auth/admin-permissions";
import { organizationAccessControl, organizationRoles } from "@/lib/auth/organization-permissions";
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
      roles: organizationRoles,
      teams: {
        enabled: true,
      },
    }),
    customSessionClient<typeof auth>(),
    inferAdditionalFields<typeof auth>({
      user: {
        role: {
          type: "string",
        },
      },
    }),
  ],
});

export type Session = typeof authClient.$Infer.Session;
export type Lab = typeof authClient.$Infer.Team;
