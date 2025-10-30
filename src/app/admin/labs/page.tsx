import { getLabsWithOrganizations } from "@/lib/admin/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function AdminLabsPage() {
  const labs = await getLabsWithOrganizations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Labs</h1>
        <p className="text-muted-foreground">
          Inventory of labs across all organizations for operational oversight.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lab Directory</CardTitle>
          <CardDescription>Each lab with its owning organization.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lab</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground text-sm">
                    No labs are registered yet.
                  </TableCell>
                </TableRow>
              )}
              {labs.map((lab) => (
                <TableRow key={lab.id}>
                  <TableCell className="font-medium">{lab.name}</TableCell>
                  <TableCell className="text-sm">
                    <Link
                      href={`/admin/organizations/${lab.organizationSlug}`}
                      className="text-primary"
                    >
                      {lab.organizationName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {lab.createdAt ? dateFormatter.format(lab.createdAt) : "—"}
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
