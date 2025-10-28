import { Button, Heading, Hr, Link, Section, Text } from "@react-email/components";
import BaseEmail from "./base-email";

interface ResetPasswordEmailProps {
  userName?: string | null;
  resetUrl: string;
  expiresInMinutes: number;
}

export function ResetPasswordEmail({
  userName,
  resetUrl,
  expiresInMinutes,
}: ResetPasswordEmailProps) {
  const name = userName ?? "there";

  return (
    <BaseEmail previewText="Reset your LIS account password.">
      <Heading className="text-2xl font-semibold text-slate-900">Reset your password</Heading>
      <Text className="mt-3 text-base leading-relaxed text-slate-700">
        Hi {name}, we received a request to reset your LIS account password. Use the button below to
        choose a new password.
      </Text>
      <Section className="mt-6 text-center">
        <Button
          href={resetUrl}
          className="inline-flex rounded-lg bg-accent px-5 py-3 text-base font-medium text-white no-underline"
        >
          Set a new password
        </Button>
      </Section>
      <Text className="mt-6 text-sm leading-relaxed text-slate-600">
        This link will expire in {expiresInMinutes} minutes. If the button does not work, copy and
        paste this URL into your browser:
        <br />
        <Link href={resetUrl} className="break-all text-accent underline">
          {resetUrl}
        </Link>
      </Text>
      <Hr className="my-6 border-slate-200" />
      <Text className="text-xs text-slate-500">
        If you didn&apos;t request a password reset, you can safely ignore this email.
      </Text>
    </BaseEmail>
  );
}
