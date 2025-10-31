import { requireGlobalAdmin } from "@/lib/auth/auth-redirects";
import { listAllPcrTestsForAdmin } from "@/lib/admin/queries";
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

const currencyFormatter = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "USD",
});

export default async function AdminLabTestsPage() {
  const session = await requireGlobalAdmin("/admin/lab-tests");
  const tests = await listAllPcrTestsForAdmin({
    userId: session.user.id,
    isGlobalAdmin: true,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lab Tests</h1>
        <p className="text-muted-foreground">
          Cross-organization view of every PCR test available in the platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
          <CardDescription>All PCR tests across labs and organizations.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Panel</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Lab</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground text-sm">
                    No lab tests have been registered yet.
                  </TableCell>
                </TableRow>
              )}
              {tests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell className="font-medium">{test.testName}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {test.testCode}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{test.panel}</TableCell>
                  <TableCell className="text-sm">
                    {test.organizationSlug ? (
                      <Link
                        href={`/admin/organizations/${test.organizationSlug}`}
                        className="text-primary"
                      >
                        {test.organizationName ?? "Unknown"}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{test.labName}</TableCell>
                  <TableCell className="text-right text-sm">
                    {currencyFormatter.format(Number(test.price ?? 0))}
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
