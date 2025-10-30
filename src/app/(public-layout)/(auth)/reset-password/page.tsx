import { redirectIfAuthenticated } from "@/lib/auth/auth-redirects";
import { ResetPasswordForm } from "./_components/reset-password-form";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function Page({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;

  await redirectIfAuthenticated();

  const token =
    typeof params?.token === "string" && params.token.length > 0 ? params.token : undefined;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
