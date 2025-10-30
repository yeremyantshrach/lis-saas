import { notFound } from "next/navigation";
import Link from "next/link";

import { requireGlobalAdmin } from "@/lib/auth/auth-redirects";
import { getOrganizationDetailBySlug, listAllPcrTestsForAdmin } from "@/lib/admin/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatRoleLabel } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface OrganizationDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function OrganizationDetailPage({ params }: OrganizationDetailPageProps) {
  const { slug } = await params;
  const session = await requireGlobalAdmin();

  const detail = await getOrganizationDetailBySlug(slug);
  if (!detail) {
    notFound();
  }

  const { organization, labs, members, pendingInvitations } = detail;

  const labTests = (
    await listAllPcrTestsForAdmin({
      userId: session.user.id,
      isGlobalAdmin: true,
    })
  ).filter((test) => test.organizationId === organization.id);

  const membersByRole = members.reduce<Record<string, number>>((acc, memberRecord) => {
    acc[memberRecord.role] = (acc[memberRecord.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/organizations"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to organizations
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{organization.name}</h1>
        <p className="text-muted-foreground">
          Slug: <span className="font-mono">{organization.slug}</span>
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Labs</CardTitle>
            <CardDescription>Labs belonging to this organization.</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold tracking-tight">{labs.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>Active member records across all labs.</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold tracking-tight">{members.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
            <CardDescription>Outstanding invitations awaiting acceptance.</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold tracking-tight">
              {pendingInvitations.length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Registered Lab Tests</CardTitle>
            <CardDescription>Unique PCR tests configured for this tenant.</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold tracking-tight">{labTests.length}</span>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Labs</CardTitle>
            <CardDescription>All labs provisioned inside this organization.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground text-sm">
                      No labs configured yet.
                    </TableCell>
                  </TableRow>
                )}
                {labs.map((lab) => (
                  <TableRow key={lab.id}>
                    <TableCell className="font-medium">{lab.name}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {lab.createdAt ? dateFormatter.format(lab.createdAt) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Member Roles</CardTitle>
            <CardDescription>Distribution of members by access role.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.keys(membersByRole).length === 0 && (
                <span className="text-muted-foreground text-sm">
                  No members are assigned to this organization.
                </span>
              )}
              {Object.entries(membersByRole)
                .sort(([, aCount], [, bCount]) => bCount - aCount)
                .map(([role, count]) => (
                  <Badge key={role} variant="outline" className="space-x-2">
                    <span>{formatRoleLabel(role)}</span>
                    <span className="font-semibold">{count}</span>
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>Full roster with assigned roles.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground text-sm">
                      No members yet.
                    </TableCell>
                  </TableRow>
                )}
                {members.map((memberRecord) => (
                  <TableRow key={memberRecord.id}>
                    <TableCell className="font-medium">
                      <span className="block">
                        {memberRecord.user?.name ?? memberRecord.user.email}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {memberRecord.user.email}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <Badge variant="outline">{formatRoleLabel(memberRecord.role)}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {memberRecord.createdAt ? dateFormatter.format(memberRecord.createdAt) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>Outstanding invitations scoped to this tenant.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground text-sm">
                      No pending invitations.
                    </TableCell>
                  </TableRow>
                )}
                {pendingInvitations.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">{invite.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatRoleLabel(invite.role)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {dateFormatter.format(invite.expiresAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Lab Tests</CardTitle>
            <CardDescription>
              PCR test catalog linked to this organization&rsquo;s labs.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Panel</TableHead>
                  <TableHead>Lab</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labTests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-sm">
                      No lab tests configured for this organization.
                    </TableCell>
                  </TableRow>
                )}
                {labTests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.testName}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {test.testCode}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{test.panel}</TableCell>
                    <TableCell className="text-sm">{test.labName}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      ${Number(test.price ?? 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
