import { requirePermission, checkPermission } from "@/lib/server-permissions";
import { listAccessiblePcrTests } from "@/lib/helpers/lab-tests-helpers";
import { PcrTestsDashboard } from "./_components/pcr-tests-dashboard";
import {
  safeGetLabById,
  safeGetLabTeamMemberships,
  safeGetLabsForOrganization,
  safeGetOrganizationBySlug,
  safeGetUserMember,
} from "@/lib/helpers/db-helpers";
import { redirect, notFound } from "next/navigation";
import { getPostAuthRedirect } from "@/lib/auth/auth-redirects";

export default async function LabTestsPage({ params }: PageProps<"/[orgSlug]/lab-tests">) {
  const { orgSlug } = await params;
  const { session } = await requirePermission("labTests:read");

  const [orgRecord] = await safeGetOrganizationBySlug(orgSlug);
  if (!orgRecord) {
    notFound();
  }

  const requestedOrgId = orgRecord.id;
  const activeOrgSlug = session.session?.activeOrganizationSlug;

  if (!activeOrgSlug) {
    redirect("/onboarding");
  }

  if (activeOrgSlug !== orgSlug) {
    redirect(getPostAuthRedirect(session));
  }

  const isGlobalAdmin = session.user.isGlobalAdmin ?? false;
  const activeLabIdFromSession = session.session?.activeLabId ?? null;

  const [userMember] = requestedOrgId
    ? await safeGetUserMember(session.user.id, requestedOrgId)
    : [null];

  if (!userMember && !isGlobalAdmin) {
    redirect("/unauthorized");
  }

  const organizationId = requestedOrgId;

  const [labsResult] = organizationId ? await safeGetLabsForOrganization(organizationId) : [[]];
  let labs: { id: string; name: string }[] = Array.isArray(labsResult)
    ? labsResult.map((lab) => ({ id: lab.id, name: lab.name }))
    : [];

  const isOrgOwner = userMember?.role === "org-owner";
  const treatsAllLabs = isOrgOwner || isGlobalAdmin;

  const labIds = labs.map((lab) => lab.id);
  const [memberships] =
    !treatsAllLabs && labIds.length > 0 && organizationId
      ? await safeGetLabTeamMemberships(organizationId, labIds)
      : [[]];

  const accessibleLabIds = new Set<string>();

  if (treatsAllLabs) {
    for (const id of labIds) {
      accessibleLabIds.add(id);
    }
  } else {
    for (const membership of memberships ?? []) {
      if (membership.userId === session.user.id) {
        accessibleLabIds.add(membership.labId);
      }
    }
  }

  if (activeLabIdFromSession && labIds.includes(activeLabIdFromSession)) {
    accessibleLabIds.add(activeLabIdFromSession);
  }

  const getFirstAccessibleLabId = () => {
    for (const id of accessibleLabIds) {
      return id;
    }
    return null;
  };

  const labIdForContext = accessibleLabIds.size
    ? accessibleLabIds.has(activeLabIdFromSession ?? "")
      ? activeLabIdFromSession
      : getFirstAccessibleLabId()
    : null;

  let tests =
    organizationId || isGlobalAdmin
      ? await listAccessiblePcrTests({
          userId: session.user.id,
          organizationId,
          labId: labIdForContext,
          isGlobalAdmin,
        })
      : [];

  if (!treatsAllLabs) {
    labs = labs.filter((lab) => accessibleLabIds.has(lab.id));
    tests = tests.filter((test) => accessibleLabIds.has(test.labId));
  }

  if (labs.length === 0 && labIdForContext) {
    const [labRecord] = await safeGetLabById(labIdForContext);
    if (labRecord) {
      labs = [{ id: labRecord.id, name: labRecord.name }];
      tests = tests.filter((test) => test.labId === labRecord.id);
    }
  }

  const [canCreate, canUpdate, canDelete] = await Promise.all([
    checkPermission("labTests:create"),
    checkPermission("labTests:update"),
    checkPermission("labTests:delete"),
  ]);

  const showLoincField = false;
  const showCptField = false;

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:gap-8 md:py-6 lg:px-6">
      <PcrTestsDashboard
        tests={tests}
        labs={labs}
        activeLabId={labIdForContext}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
        orgSlug={orgSlug}
        showLoincField={showLoincField}
        showCptField={showCptField}
      />
    </div>
  );
}
