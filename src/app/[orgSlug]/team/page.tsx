import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/server-permissions";

export default async function TeamPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  await requirePermission("org:read");

  redirect(`/${orgSlug}/labs?tab=members`);
}
