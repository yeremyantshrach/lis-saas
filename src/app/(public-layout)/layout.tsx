import type { ReactNode } from "react";
import { PublicNavBar } from "@/components/public-nav-bar";

export default function PublicLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <>
      <PublicNavBar signInHref="/sign-in" ctaHref="/sign-up" />
      {children}
    </>
  );
}
