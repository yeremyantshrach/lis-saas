import { safeGetOrganizationBySlug, safeGetOrganizationById } from "@/lib/helpers/db-helpers";

export const getOrganizationBySlug = async (slug: string) => {
  const [org, error] = await safeGetOrganizationBySlug(slug);
  return error ? null : org || null;
};

export const getOrganizationById = async (id: string) => {
  const [org, error] = await safeGetOrganizationById(id);
  return error ? null : org || null;
};
