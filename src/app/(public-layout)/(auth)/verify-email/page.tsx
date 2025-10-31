import { redirectIfAuthenticated } from "@/lib/auth/auth-redirects";
import { VerifyEmailCard } from "./_components/verify-email-card";

interface VerifyEmailPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function Page({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;

  await redirectIfAuthenticated();

  const email =
    typeof params?.email === "string" && params.email.length > 0 ? params.email : undefined;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <VerifyEmailCard email={email} />
      </div>
    </div>
  );
}
