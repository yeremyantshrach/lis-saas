import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { tryCatch } from "@/lib/try-catch";
import { requirePermission } from "@/lib/server-permissions";
import {
  safeGetLabById,
  safeGetLabTeamMemberships,
  safeGetUserMember,
} from "@/lib/helpers/db-helpers";
import { PatientWizard } from "../_components/patient-wizard";

interface NewPatientPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function NewPatientPage({ params }: NewPatientPageProps) {
  const { orgSlug } = await params;
  const { session } = await requirePermission("labPatients:create");
  const organizationId = session.session?.activeOrganizationId ?? null;
  const activeLabId = session.session?.activeLabId ?? null;
  const isGlobalAdmin = session.user.isGlobalAdmin ?? false;

  const requestHeaders = await headers();
  const [labsResponse] = await tryCatch(
    auth.api.listOrganizationTeams({
      headers: requestHeaders,
    }),
  );

  let labs: { id: string; name: string }[] = Array.isArray(labsResponse)
    ? labsResponse.map((lab) => ({ id: lab.id, name: lab.name }))
    : [];

  const [userMember] = organizationId
    ? await safeGetUserMember(session.user.id, organizationId)
    : [null];
  const isOrgOwner = userMember?.role === "org-owner";

  if (!isOrgOwner && !isGlobalAdmin) {
    const labIds = labs.map((lab) => lab.id);
    const [memberships] =
      labIds.length > 0 && organizationId
        ? await safeGetLabTeamMemberships(organizationId, labIds)
        : [[]];

    const accessibleLabIds = new Set<string>();
    if (activeLabId) accessibleLabIds.add(activeLabId);

    for (const membership of memberships ?? []) {
      if (membership.userId === session.user.id) {
        accessibleLabIds.add(membership.labId);
      }
    }

    labs = labs.filter((lab) => accessibleLabIds.has(lab.id));
  }

  if (labs.length === 0 && activeLabId) {
    const [labRecord] = await safeGetLabById(activeLabId);
    if (labRecord) {
      labs = [{ id: labRecord.id, name: labRecord.name }];
    }
  }

  if (labs.length === 0) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Add Patient</h1>
        <p className="text-muted-foreground">
          Step through identity, insurance, billing, and document capture for this lab.
        </p>
      </div>
      <PatientWizard labs={labs} defaultLabId={activeLabId ?? labs[0]?.id} orgSlug={orgSlug} />
    </div>
  );
}
