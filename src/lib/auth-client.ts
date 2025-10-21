import { createAuthClient } from "better-auth/client";
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
  ],
});
