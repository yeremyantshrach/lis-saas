import { redirectIfAuthenticated } from "@/lib/auth/auth-redirects";
import { ForgotPasswordForm } from "./_components/forgot-password-form";

interface ForgotPasswordPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function Page({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;

  await redirectIfAuthenticated();

  const email =
    typeof params?.email === "string" && params.email.length > 0 ? params.email : undefined;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ForgotPasswordForm defaultEmail={email} />
      </div>
    </div>
  );
}
