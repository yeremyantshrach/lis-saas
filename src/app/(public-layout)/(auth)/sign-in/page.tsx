import { redirectIfAuthenticated } from "@/lib/auth-redirects";
import { SignInForm } from "@/components/auth/sign-in-form";

export default async function Page() {
  await redirectIfAuthenticated();

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignInForm />
      </div>
    </div>
  );
}
