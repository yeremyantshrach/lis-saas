import { safeGetUserOrganization } from "@/lib/helpers/db-helpers";

export const getUserOrganization = async (userId: string) => {
  const [userMember, error] = await safeGetUserOrganization(userId);

  if (error || !userMember?.organization) {
    return null;
  }

  return userMember.organization;
};
