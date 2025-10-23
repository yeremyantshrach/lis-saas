import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function InvitationNotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle>Invitation not found</CardTitle>
          <CardDescription>
            The invitation you&apos;re trying to access could not be found or may have been revoked.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link
            href="/"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go back home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
