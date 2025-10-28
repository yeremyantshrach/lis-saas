import { Button, Heading, Hr, Link, Section, Text } from "@react-email/components";
import BaseEmail from "./base-email";

interface VerificationEmailProps {
  userName?: string | null;
  verificationUrl: string;
  token: string;
}

export function VerificationEmail({ userName, verificationUrl, token }: VerificationEmailProps) {
  const name = userName ?? "there";

  return (
    <BaseEmail previewText="Verify your email to start using LIS.">
      <Heading className="text-2xl font-semibold text-slate-900">Confirm your email</Heading>
      <Text className="mt-3 text-base leading-relaxed text-slate-700">
        Hi {name}, thanks for signing up with LIS. Please confirm your email address so we can
        finish setting up your account.
      </Text>
      <Section className="mt-6 text-center">
        <Button
          href={verificationUrl}
          className="inline-flex rounded-lg bg-accent px-5 py-3 text-base font-medium text-white no-underline"
        >
          Verify email address
        </Button>
      </Section>
      <Text className="mt-6 text-sm leading-relaxed text-slate-600">
        If the button does not work, copy and paste this URL into your browser:
        <br />
        <Link href={verificationUrl} className="break-all text-accent underline">
          {verificationUrl}
        </Link>
      </Text>
      <Hr className="my-6 border-slate-200" />
      <Text className="text-xs text-slate-500">
        Token: {token}
        <br />
        If you did not create an account with LIS, you can safely ignore this email.
      </Text>
    </BaseEmail>
  );
}
