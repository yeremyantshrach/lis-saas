import Link from "next/link";

import { getOrganizationsWithStats } from "@/lib/admin/queries";
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

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function AdminOrganizationsPage() {
  const organizations = await getOrganizationsWithStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground">
          Audit and manage every tenant, including lab footprint and membership health.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
          <CardDescription>Comprehensive list of all organizations in the system.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-center">Labs</TableHead>
                <TableHead className="text-center">Members</TableHead>
                <TableHead className="text-center">Pending Invites</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground text-sm">
                    No organizations have been created yet.
                  </TableCell>
                </TableRow>
              )}

              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/organizations/${org.slug}`} className="text-primary">
                      {org.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{org.slug}</TableCell>
                  <TableCell className="text-center text-sm">{org.labCount}</TableCell>
                  <TableCell className="text-center text-sm">{org.memberCount}</TableCell>
                  <TableCell className="text-center text-sm">
                    {org.pendingInviteCount > 0 ? (
                      <Badge variant="outline">{org.pendingInviteCount}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {dateFormatter.format(org.createdAt)}
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
