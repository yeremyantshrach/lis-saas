import { redirectIfAuthenticated } from "@/lib/auth-redirects";
import { SignupForm } from "@/components/auth/signup-form";

export default async function SignupPage() {
  await redirectIfAuthenticated();

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  );
}
