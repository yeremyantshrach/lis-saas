import { headers } from "next/headers";
import { requirePermission, checkPermission } from "@/lib/server-permissions";
import { listAccessiblePcrTests } from "@/lib/helpers/lab-tests-helpers";
import { PcrTestsDashboard } from "./_components/pcr-tests-dashboard";
import { auth } from "@/lib/auth";
import { tryCatch } from "@/lib/try-catch";
import { safeGetLabById } from "@/lib/helpers/db-helpers";

export default async function LabTestsPage({ params }: PageProps<"/[orgSlug]/lab-tests">) {
  const { orgSlug } = await params;
  const { session } = await requirePermission("labTests:read");

  const organizationId = session.session?.activeOrganizationId ?? null;
  const activeLabId = session.session?.activeLabId ?? null;

  const tests = organizationId
    ? await listAccessiblePcrTests({
        userId: session.user.id,
        organizationId,
        labId: activeLabId,
      })
    : [];

  const requestHeaders = await headers();
  const [labsResponse] = await tryCatch(
    auth.api.listOrganizationTeams({
      headers: requestHeaders,
    }),
  );

  let labs: { id: string; name: string }[] = Array.isArray(labsResponse)
    ? labsResponse.map((lab) => ({ id: lab.id, name: lab.name }))
    : [];

  if (labs.length === 0 && activeLabId) {
    const [labRecord] = await safeGetLabById(activeLabId);
    if (labRecord) {
      labs = [{ id: labRecord.id, name: labRecord.name }];
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
        activeLabId={activeLabId}
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
