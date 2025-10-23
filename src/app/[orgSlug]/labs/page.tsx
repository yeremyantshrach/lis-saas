import { checkPermission, requirePermission } from "@/lib/server-permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionGuard } from "@/components/permission-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LabsTable } from "@/components/labs-table";
import { InviteForm } from "@/components/forms/invite-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { IconFlask, IconUsers, IconUserPlus } from "@tabler/icons-react";
import { db } from "@/lib/database";
import { tryCatch } from "@/lib/try-catch";
import { formatRoleLabel } from "@/lib/utils";
import { TeamMembersTable } from "@/components/team-members-table";
import { InvitationsTable } from "@/components/invitations-table";

interface LabsPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams?: Promise<{ tab?: string }>;
}

export default async function LabsPage({ params, searchParams }: LabsPageProps) {
  const { orgSlug } = await params;
  const resolvedSearchParams = (searchParams ? await searchParams : {}) as {
    tab?: string | string[];
  };
  const tabFromQuery =
    typeof resolvedSearchParams.tab === "string" ? resolvedSearchParams.tab : undefined;

  const { session } = await requirePermission("team:read");

  const requestHeaders = await headers();
  const [labsResponse, canViewMembers, canInvite, canUpdateLabs, canDeleteLabs] = await Promise.all(
    [
      auth.api.listOrganizationTeams({
        headers: requestHeaders,
      }),
      checkPermission("team:read"),
      checkPermission("team:invite"),
      checkPermission("team:update"),
      checkPermission("team:delete"),
    ],
  );

  const canManageLabs = canUpdateLabs || canDeleteLabs;

  const allLabs = Array.isArray(labsResponse) ? labsResponse : [];

  let activeOrg: Awaited<ReturnType<typeof auth.api.getFullOrganization>> | null = null;
  if (canViewMembers) {
    const [orgResult] = await tryCatch(
      auth.api.getFullOrganization({
        headers: requestHeaders,
      }),
    );
    activeOrg = orgResult ?? null;
  }
  const collator = new Intl.Collator("en", { sensitivity: "base" });
  const members = activeOrg?.members
    ? [...activeOrg.members].sort((a, b) =>
        collator.compare(a.user.name || a.user.email, b.user.name || b.user.email),
      )
    : [];
  const uniqueRoles = members.length
    ? [...new Set(members.map((member) => formatRoleLabel(member.role)))]
    : [];

  const activeTeamId = session.session?.activeTeamId ?? null;
  const currentUserId = session.user.id;
  const currentMember =
    members.find((member) => {
      return member.userId === currentUserId;
    }) ?? null;

  let visibleLabs = allLabs;
  if (activeTeamId && (!canManageLabs || currentMember?.role === "lab-admin")) {
    visibleLabs = allLabs.filter((lab) => lab.id === activeTeamId);
  }

  const organizationId = session.session?.activeOrganizationId;
  const pendingInvitations =
    canInvite && organizationId
      ? await db.query.invitation.findMany({
          where: (invitation, { and, eq }) =>
            and(eq(invitation.organizationId, organizationId), eq(invitation.status, "pending")),
          with: {
            lab: true,
          },
          orderBy: (invitation, { desc }) => [desc(invitation.createdAt)],
        })
      : [];
  const filteredPendingInvitations =
    activeTeamId && (!canManageLabs || currentMember?.role === "lab-admin")
      ? pendingInvitations.filter(
          (invitation) => (invitation.labId ?? invitation.lab?.id) === activeTeamId,
        )
      : pendingInvitations;

  const allowedTabs = ["labs"];
  if (canViewMembers) {
    allowedTabs.push("members");
  }
  if (canInvite) {
    allowedTabs.push("invite");
  }

  const initialTab = tabFromQuery && allowedTabs.includes(tabFromQuery) ? tabFromQuery : "labs";

  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-3xl font-bold">Labs &amp; Team</h1>

      <div className="grid gap-4 pb-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Labs</CardTitle>
            <IconFlask className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{visibleLabs.length}</div>
            <CardDescription>Labs available to your organization.</CardDescription>
          </CardContent>
        </Card>

        {canViewMembers && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <IconUsers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{members.length}</div>
              <CardDescription>
                {uniqueRoles.length ? uniqueRoles.join(" · ") : "Roles assigned per member"}
              </CardDescription>
            </CardContent>
          </Card>
        )}

        {canInvite && (
          <Card className="border-dashed">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invite Collaborators</CardTitle>
              <IconUserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription>Bring new teammates directly into the right lab.</CardDescription>
              <PermissionGuard permission="team:invite">
                <Button asChild size="sm">
                  <Link href={`/${orgSlug}/labs?tab=invite`}>Send invite</Link>
                </Button>
              </PermissionGuard>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="w-full justify-start gap-2 overflow-x-auto">
          <TabsTrigger value="labs">Labs</TabsTrigger>
          {canViewMembers && <TabsTrigger value="members">Team Members</TabsTrigger>}
          {canInvite && (
            <PermissionGuard permission="team:invite">
              <TabsTrigger value="invite">Invite Member</TabsTrigger>
            </PermissionGuard>
          )}
        </TabsList>

        <TabsContent value="labs" className="mt-6">
          <LabsTable labs={visibleLabs} canManageLabs={canManageLabs} />
        </TabsContent>

        {canViewMembers && (
          <TabsContent value="members" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Directory</CardTitle>
                <CardDescription>
                  Browse every teammate with role and join date context.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeamMembersTable members={members} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canInvite && (
          <PermissionGuard permission="team:invite">
            <TabsContent value="invite" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Send Invitation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <InviteForm orgSlug={orgSlug} labs={visibleLabs} />
                  <div className="space-y-4 border-t pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Pending Invitations</CardTitle>
                        <CardDescription>
                          Your open invitations and their expiration dates.
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{filteredPendingInvitations.length}</Badge>
                    </div>
                    <InvitationsTable invitations={filteredPendingInvitations} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </PermissionGuard>
        )}
      </Tabs>
    </div>
  );
}
