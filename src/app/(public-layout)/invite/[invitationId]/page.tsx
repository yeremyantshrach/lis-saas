import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { AcceptInvitationCard } from "@/components/accept-invitation-card";
import { tryCatch } from "@/lib/try-catch";
import { APIError } from "better-auth/api";

interface AcceptInvitationPageProps {
  params: Promise<{ invitationId: string }>;
}

export default async function AcceptInvitationPage({ params }: AcceptInvitationPageProps) {
  const { invitationId } = await params;
  const requestHeaders = await headers();

  const [session] = await tryCatch(auth.api.getSession({ headers: requestHeaders }));
  const [invitation, invitationError] = await tryCatch(
    auth.api.getInvitation({
      query: { id: invitationId },
      headers: requestHeaders,
    }),
  );

  if (!invitation) {
    if (invitationError instanceof APIError) {
      if (invitationError.status === "UNAUTHORIZED") {
        return (
          <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
            <AcceptInvitationCard
              invitationId={invitationId}
              invitationAvailable={false}
              isExpired={false}
              isAuthenticated={Boolean(session?.user)}
              emailMatches={false}
              currentUserEmail={session?.user?.email ?? null}
            />
          </div>
        );
      }

      if (invitationError.status === "NOT_FOUND" || invitationError.status === "FORBIDDEN") {
        notFound();
      }
    }
    throw invitationError;
  }

  const isExpired = new Date(invitation.expiresAt) < new Date();
  const isAuthenticated = Boolean(session?.user);
  const currentUserEmail = session?.user?.email ?? null;
  const emailMatches = currentUserEmail
    ? currentUserEmail.toLowerCase() === invitation.email.toLowerCase()
    : false;

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <AcceptInvitationCard
        invitationId={invitation.id}
        invitationAvailable
        organizationName={invitation.organizationName}
        organizationSlug={invitation.organizationSlug}
        invitationEmail={invitation.email}
        labName={"labName"}
        status={invitation.status}
        expiresAt={invitation.expiresAt.toString()}
        isExpired={isExpired}
        isAuthenticated={isAuthenticated}
        emailMatches={emailMatches}
        currentUserEmail={currentUserEmail}
      />
    </div>
  );
}
