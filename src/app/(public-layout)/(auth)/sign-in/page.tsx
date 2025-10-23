import { redirectIfAuthenticated } from "@/lib/auth-redirects";
import { SignInForm } from "@/components/auth/sign-in-form";

interface SignInPageProps {
  searchParams: Promise<{ invitationId?: string }>;
}

export default async function Page({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const invitationId =
    typeof params?.invitationId === "string" && params.invitationId.length > 0
      ? params.invitationId
      : undefined;

  await redirectIfAuthenticated({ invitationId });

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignInForm invitationId={invitationId} />
      </div>
    </div>
  );
}
