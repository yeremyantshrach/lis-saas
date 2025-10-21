import { db } from "@/lib/database";
import { organization } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const getOrganizationBySlug = async (slug: string) => {
  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  });
  return org || null;
};

export const getOrganizationById = async (id: string) => {
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, id),
  });
  return org || null;
};
