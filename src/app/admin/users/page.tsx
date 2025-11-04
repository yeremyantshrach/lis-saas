import { requireGlobalAdmin } from "@/lib/auth/auth-redirects";
import { getAllUsers } from "@/lib/admin/queries";
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
import { ImpersonateUserButton } from "@/components/admin-impersonate-button";
import { formatRoleLabel } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function AdminUsersPage() {
  const session = await requireGlobalAdmin("/admin/users");
  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          View every account, audit roles, and switch context via impersonation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>Global registry of all registered users.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Organization Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-sm">
                    No users have been created yet.
                  </TableCell>
                </TableRow>
              )}
              {users.map((account) => (
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
                  <TableCell className="text-sm">
                    {account.members?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {account.members.map((membership) => (
                          <Badge
                            key={`${membership.organizationId}:${membership.role}`}
                            variant="secondary"
                          >
                            {membership.organization?.name ?? "Unknown Org"} ·{" "}
                            {formatRoleLabel(membership.role)}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {account.banned ? (
                      <Badge variant="destructive">Banned</Badge>
                    ) : account.emailVerified ? (
                      <Badge variant="secondary">Verified</Badge>
                    ) : (
                      <Badge variant="outline">Pending verification</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {dateFormatter.format(account.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ImpersonateUserButton
                      userId={account.id}
                      userName={account.name}
                      disabled={account.id === session.user.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
