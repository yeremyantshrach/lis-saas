import { Button, Heading, Hr, Link, Section, Text } from "@react-email/components";
import BaseEmail from "./base-email";

interface InvitationEmailProps {
  inviteeEmail: string;
  inviterName?: string | null;
  organizationName: string;
  invitationUrl: string;
  role: string;
  labName?: string | null;
}

const formatRole = (role: string) =>
  role
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export function InvitationEmail({
  inviteeEmail,
  inviterName,
  organizationName,
  invitationUrl,
  role,
  labName,
}: InvitationEmailProps) {
  const roleLabel = formatRole(role);
  const inviter = inviterName ?? "A teammate";

  return (
    <BaseEmail previewText={`You're invited to join ${organizationName} on LIS.`}>
      <Heading className="text-2xl font-semibold text-slate-900">
        You&apos;re invited to join {organizationName}
      </Heading>
      <Text className="mt-3 text-base leading-relaxed text-slate-700">
        Hello {inviteeEmail}, {inviter} invited you to collaborate in {organizationName} as{" "}
        <strong>{roleLabel}</strong>.
        {labName ? (
          <>
            {" "}
            You&apos;ll be part of the <strong>{labName}</strong> lab team.
          </>
        ) : null}
      </Text>
      <Section className="mt-6 text-center">
        <Button
          href={invitationUrl}
          className="inline-flex rounded-lg bg-accent px-5 py-3 text-base font-medium text-white no-underline"
        >
          Accept invitation
        </Button>
      </Section>
      <Text className="mt-6 text-sm leading-relaxed text-slate-600">
        This invitation is tied to {inviteeEmail}. If the button does not work, copy and paste this
        URL into your browser:
        <br />
        <Link href={invitationUrl} className="break-all text-accent underline">
          {invitationUrl}
        </Link>
      </Text>
      <Hr className="my-6 border-slate-200" />
      <Text className="text-xs text-slate-500">
        Didn&apos;t expect this email? You can safely ignore it.
      </Text>
    </BaseEmail>
  );
}
