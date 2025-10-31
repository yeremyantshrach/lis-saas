import { redirectIfAuthenticated } from "@/lib/auth/auth-redirects";
import { SignupForm } from "./_components/signup-form";

interface SignupPageProps {
  searchParams: Promise<{ invitationId?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const invitationId =
    typeof params?.invitationId === "string" && params.invitationId.length > 0
      ? params.invitationId
      : undefined;

  await redirectIfAuthenticated({ invitationId });

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm invitationId={invitationId} />
      </div>
    </div>
  );
}
