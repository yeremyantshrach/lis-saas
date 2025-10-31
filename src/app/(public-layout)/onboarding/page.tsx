import { redirect } from "next/navigation";
import { getPostAuthRedirect, requireAuthenticated } from "@/lib/auth/auth-redirects";
import { CreateOrganizationForm } from "./_components/create-organization-form";

export default async function OnboardingPage() {
  const session = await requireAuthenticated("/onboarding");

  if (session.user.isGlobalAdmin || session.user.role === "admin") {
    redirect("/admin");
  }

  const activeOrgSlug = session.session?.activeOrganizationSlug;

  if (activeOrgSlug) {
    redirect(getPostAuthRedirect(session));
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold">Welcome to the Onboarding Process</h1>
        <CreateOrganizationForm />
      </div>
    </div>
  );
}
