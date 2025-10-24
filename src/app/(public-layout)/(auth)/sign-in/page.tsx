import { redirectIfAuthenticated } from "@/lib/auth/auth-redirects";
import { SignInForm } from "@/components/auth/sign-in-form";

interface SignInPageProps {
  searchParams: Promise<{ invitationId?: string; verified?: string; reset?: string }>;
}

export default async function Page({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const invitationId =
    typeof params?.invitationId === "string" && params.invitationId.length > 0
      ? params.invitationId
      : undefined;
  const isEmailVerified = typeof params?.verified === "string" && params.verified.length > 0;
  const passwordResetSuccess = params?.reset === "success";
  await redirectIfAuthenticated({ invitationId });

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignInForm
          invitationId={invitationId}
          isEmailVerified={isEmailVerified}
          passwordResetSuccess={passwordResetSuccess}
        />
      </div>
    </div>
  );
}
