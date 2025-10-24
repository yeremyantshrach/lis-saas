"use client";

import { ComponentProps, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { resendVerificationEmailAction } from "@/app/(public-layout)/(auth)/verify-email/actions";
import { resendVerificationSchema, type ResendVerificationFormData } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface VerifyEmailCardProps extends ComponentProps<"div"> {
  email?: string;
}

export function VerifyEmailCard({ email, className, ...props }: VerifyEmailCardProps) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResendVerificationFormData>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: { email: email ?? "" },
    mode: "onBlur",
  });

  const onSubmit = (data: ResendVerificationFormData) => {
    startTransition(async () => {
      const result = await resendVerificationEmailAction(data);

      if (!result.success) {
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              setError(field as keyof ResendVerificationFormData, {
                type: "manual",
                message: messages[0],
              });
            }
          });
        }

        toast.error(result.error || "Failed to send verification email.");
        return;
      }

      toast.success(result.message || "Verification email sent. Check your inbox.");
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            {email
              ? `We sent a verification link to ${email}. Please follow the link in the email to activate your account.`
              : "Enter your email address to resend the verification link."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register("email")}
                  disabled={isPending}
                  aria-invalid={!!errors.email}
                />
                <FieldDescription className={cn(errors.email && "text-destructive")}>
                  {errors.email?.message ||
                    (email
                      ? "Need to use a different email? Update it below and resend the link."
                      : "Use the email address associated with your account.")}
                </FieldDescription>
              </Field>
              <Field>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Sending email..." : "Resend verification email"}
                </Button>
                <FieldDescription className="text-center">
                  Already verified?{" "}
                  <Link href="/sign-in" className="underline underline-offset-4 hover:text-primary">
                    Sign in
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Didn&apos;t receive the email? Check your spam folder or whitelist our address.</p>
              <p>You can request a new link once every few minutes.</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
