"use client";

import { useState, useTransition, type ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { requestPasswordResetAction } from "@/app/(public-layout)/(auth)/forgot-password/actions";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MailCheck } from "lucide-react";

interface ForgotPasswordFormProps extends ComponentProps<"div"> {
  defaultEmail?: string;
}

export function ForgotPasswordForm({ defaultEmail, className, ...props }: ForgotPasswordFormProps) {
  const [isPending, startTransition] = useTransition();
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
    defaultValues: {
      email: defaultEmail ?? "",
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    startTransition(async () => {
      const result = await requestPasswordResetAction(data);

      if (!result.success) {
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              setError(field as keyof ForgotPasswordFormData, {
                type: "manual",
                message: messages[0],
              });
            }
          });
        }

        toast.error(result.error || "Failed to send reset instructions.");
        return;
      }

      setEmailSentTo(data.email);
      toast.success(result.message || "Password reset instructions sent.");
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Forgot password?</CardTitle>
          <CardDescription>
            Enter the email associated with your account and we&apos;ll send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailSentTo && (
            <Alert>
              <MailCheck className="text-primary" />
              <AlertTitle>Reset link sent</AlertTitle>
              <AlertDescription>
                Check <span className="font-medium">{emailSentTo}</span> for a link to reset your
                password. Be sure to look in your spam folder if you don&apos;t see it soon.
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="forgot-password-email">Email</FieldLabel>
                <Input
                  id="forgot-password-email"
                  type="email"
                  placeholder="m@example.com"
                  {...register("email")}
                  disabled={isPending}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <FieldDescription className="text-destructive">
                    {errors.email.message}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Sending..." : "Send reset link"}
                </Button>
                <FieldDescription className="text-center">
                  Remembered your password?{" "}
                  <Link href="/sign-in" className="underline underline-offset-4 hover:text-primary">
                    Back to sign in
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
