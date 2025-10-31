import Link from "next/link";

import {
  getAdminOverviewStats,
  getRecentOrganizations,
  getRecentPendingInvitations,
  getRecentUsers,
} from "@/lib/admin/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRoleLabel } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function AdminOverviewPage() {
  const [stats, recentOrgs, recentUsers, pendingInvites] = await Promise.all([
    getAdminOverviewStats(),
    getRecentOrganizations(),
    getRecentUsers(),
    getRecentPendingInvitations(),
  ]);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
            <CardDescription>Active tenants created across the platform.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <span className="text-3xl font-semibold tracking-tight">
              {stats.organizationCount.toLocaleString()}
            </span>
            <Badge variant="outline" className="text-xs">
              {stats.pendingInviteCount.toLocaleString()} pending invites
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Labs</CardTitle>
            <CardDescription>Total labs provisioned across all organizations.</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold tracking-tight">
              {stats.labCount.toLocaleString()}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Unique accounts registered in the system.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <span className="text-3xl font-semibold tracking-tight">
              {stats.userCount.toLocaleString()}
            </span>
            <Badge variant="secondary" className="text-xs">
              {stats.activeSessionCount.toLocaleString()} active sessions
            </Badge>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Latest Organizations</CardTitle>
              <CardDescription>Most recently created tenants.</CardDescription>
            </div>
            <Link href="/admin/organizations" className="text-sm font-medium text-primary">
              View all
            </Link>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrgs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground text-sm">
                      No organizations yet.
                    </TableCell>
                  </TableRow>
                )}
                {recentOrgs.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/organizations/${org.slug}`} className="text-primary">
                        {org.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{org.slug}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {dateFormatter.format(org.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Newest Users</CardTitle>
              <CardDescription>Fresh accounts created in the last rollout.</CardDescription>
            </div>
            <Link href="/admin/users" className="text-sm font-medium text-primary">
              View all
            </Link>
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
                {recentUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground text-sm">
                      No registered users yet.
                    </TableCell>
                  </TableRow>
                )}
                {recentUsers.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      <span className="block">{account.name ?? account.email}</span>
                      <span className="text-muted-foreground text-xs">{account.email}</span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {account.role ? (
                        <Badge variant="outline">{formatRoleLabel(account.role)}</Badge>
                      ) : (
                        <span className="text-muted-foreground">standard</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {dateFormatter.format(account.createdAt)}
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Invites awaiting acceptance across all organizations.
              </CardDescription>
            </div>
            <Link href="/admin/organizations" className="text-sm font-medium text-primary">
              Manage invitations
            </Link>
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
                {pendingInvites.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground text-sm">
                      No outstanding invitations.
                    </TableCell>
                  </TableRow>
                )}
                {pendingInvites.map((invite) => (
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
    </div>
  );
}
