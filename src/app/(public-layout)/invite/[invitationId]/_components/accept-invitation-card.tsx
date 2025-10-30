"use client";

import { useMemo, useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { acceptInvitationAction } from "@/lib/actions/accept-invitation-action";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconLoader2,
  IconMail,
  IconSparkles,
  IconUsersGroup,
} from "@tabler/icons-react";

interface AcceptInvitationCardProps {
  invitationId: string;
  invitationAvailable: boolean;
  organizationName?: string;
  organizationSlug?: string;
  invitationEmail?: string;
  labName?: string | null;
  status?: string;
  expiresAt?: string;
  isExpired?: boolean;
  isAuthenticated: boolean;
  emailMatches: boolean;
  currentUserEmail?: string | null;
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function AcceptInvitationCard({
  invitationId,
  invitationAvailable,
  organizationName,
  organizationSlug,
  invitationEmail,
  labName,
  status,
  expiresAt,
  isExpired = false,
  isAuthenticated,
  emailMatches,
  currentUserEmail,
}: AcceptInvitationCardProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const summary = useMemo(() => {
    if (!invitationAvailable || !organizationName || !expiresAt) {
      return null;
    }

    return {
      org: organizationName,
      lab: labName,
      email: invitationEmail,
      expires: dateFormatter.format(new Date(expiresAt)),
    };
  }, [invitationAvailable, organizationName, labName, invitationEmail, expiresAt]);

  const handleAccept = () => {
    if (!invitationAvailable) return;

    setError(null);
    startTransition(async () => {
      const result = await acceptInvitationAction(invitationId);
      if (!result.success) {
        setError(result.error ?? "Failed to accept invitation.");
        return;
      }

      router.push(organizationSlug ? `/${organizationSlug}/dashboard` : "/dashboard");
    });
  };

  const renderAuthCTA = () => (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button asChild className="w-full sm:w-auto">
        <Link href={`/sign-up?invitationId=${encodeURIComponent(invitationId)}`}>
          Sign up to continue
        </Link>
      </Button>
      <Button asChild variant="outline" className="w-full sm:w-auto">
        <Link href={`/sign-in?invitationId=${encodeURIComponent(invitationId)}`}>
          Sign in instead
        </Link>
      </Button>
    </div>
  );

  let content: React.ReactNode = null;

  if (!invitationAvailable) {
    content = (
      <div className="space-y-5">
        <div className="rounded-lg border border-dashed bg-muted/50 p-4 text-left">
          <div className="flex items-center gap-3">
            <IconUsersGroup className="h-5 w-5 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Sign up or sign in with the email from your invite to view the details and join the
              organization.
            </p>
          </div>
        </div>
        {renderAuthCTA()}
        <Button variant="ghost" asChild className="w-full sm:w-auto">
          <Link href="/">
            <IconArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Back to homepage
          </Link>
        </Button>
      </div>
    );
  } else if (status !== "pending") {
    content = (
      <div className="space-y-5">
        <div className="rounded-lg border border-dashed bg-muted/50 p-4 text-left">
          <div className="flex items-center gap-3">
            <IconAlertCircle className="h-5 w-5 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">
              This invitation is no longer pending. Current status:{" "}
              <span className="font-semibold capitalize">{status}</span>.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/sign-in">Go to sign in</Link>
        </Button>
      </div>
    );
  } else if (isExpired) {
    content = (
      <div className="rounded-lg border border-dashed bg-muted/50 p-4 text-left">
        <div className="flex items-center gap-3">
          <IconAlertCircle className="h-5 w-5 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            This invitation expired on{" "}
            <span className="font-semibold">{summary?.expires ?? "its expiration date"}</span>.
            Contact the organization admin to request a fresh invite.
          </p>
        </div>
      </div>
    );
  } else if (!isAuthenticated) {
    content = (
      <div className="space-y-5">
        <div className="rounded-lg border border-dashed bg-muted/50 p-4 text-left">
          <div className="flex items-center gap-3">
            <IconMail className="h-5 w-5 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Create an account or sign in with{" "}
              <span className="font-semibold">{summary?.email ?? "the invited email"}</span> before
              accepting this invitation.
            </p>
          </div>
        </div>
        {renderAuthCTA()}
      </div>
    );
  } else if (!emailMatches) {
    content = (
      <div className="rounded-lg border border-dashed bg-muted/50 p-4 text-left">
        <div className="flex items-center gap-3">
          <IconAlertCircle className="h-5 w-5 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            This invitation was issued to{" "}
            <span className="font-semibold">{summary?.email ?? "the invited email"}</span>, but you
            are signed in as{" "}
            <span className="font-semibold">{currentUserEmail ?? "another account"}</span>. Please
            sign out and sign back in with the invited email.
          </p>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Organization</p>
              <p className="text-base font-semibold">{summary?.org ?? "Organization"}</p>
            </div>
            <IconSparkles className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
          {summary?.lab && (
            <div className="mt-4 rounded-md border bg-muted/40 p-3">
              <p className="text-xs uppercase text-muted-foreground">Lab</p>
              <p className="text-sm font-medium">{summary.lab}</p>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {summary?.email && (
              <Badge variant="outline" className="flex items-center gap-1">
                <IconMail className="h-3.5 w-3.5" aria-hidden />
                {summary.email}
              </Badge>
            )}
            {summary?.expires && (
              <span className="text-sm text-muted-foreground">Expires {summary.expires}</span>
            )}
          </div>
        </div>
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <Button onClick={handleAccept} disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Accepting...
            </>
          ) : (
            "Accept invitation"
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-lg border-none shadow-xl">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl font-semibold">Accept invitation</CardTitle>
        <CardDescription>
          {summary?.org
            ? `Join ${summary.org} to access the workspace.`
            : "Sign up or sign in to unlock this invitation."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">{content}</CardContent>
    </Card>
  );
}
