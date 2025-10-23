import { db } from "@/lib/database";
import { member } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const getUserOrganization = async (userId: string) => {
  const userMember = await db.query.member.findFirst({
    where: eq(member.userId, userId),
    with: {
      organization: {
        with: {
          members: {
            with: {
              user: true,
            },
          },
        },
      },
    },
  });
  if (!userMember || !userMember.organization) {
    return null;
  }
  return userMember.organization;
};
