"use client";

import { ComponentProps, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations/auth";
import { resetPasswordAction } from "@/app/(public-layout)/(auth)/reset-password/actions";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

interface ResetPasswordFormProps extends ComponentProps<"div"> {
  token?: string;
}

export function ResetPasswordForm({ token, className, ...props }: ResetPasswordFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
    defaultValues: {
      token: token ?? "",
      password: "",
      confirmPassword: "",
    },
  });

  const tokenMissing = !token;

  const onSubmit = (data: ResetPasswordFormData) => {
    if (tokenMissing) {
      toast.error("Reset token missing. Request a new password reset link.");
      return;
    }

    startTransition(async () => {
      const result = await resetPasswordAction(data);

      if (!result.success) {
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              setError(field as keyof ResetPasswordFormData, {
                type: "manual",
                message: messages[0],
              });
            }
          });
        }

        toast.error(result.error || "Failed to reset password.");
        return;
      }

      toast.success(result.message || "Password updated successfully.");

      if (result.redirectUrl) {
        router.push(result.redirectUrl);
        return;
      }

      router.push("/sign-in");
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Set a new password</CardTitle>
          <CardDescription>
            Choose a strong password you haven&apos;t used with this account before.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tokenMissing && (
            <Alert variant="destructive">
              <ShieldAlert />
              <AlertTitle>Reset link invalid</AlertTitle>
              <AlertDescription>
                The reset link is missing or expired.{" "}
                <Link href="/forgot-password" className="font-medium underline underline-offset-4">
                  Request a new link.
                </Link>
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field className="hidden">
                <Input type="hidden" {...register("token")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="new-password">New password</FieldLabel>
                <Input
                  id="new-password"
                  type="password"
                  {...register("password")}
                  disabled={isPending || tokenMissing}
                  aria-invalid={!!errors.password}
                />
                {errors.password ? (
                  <FieldDescription className="text-destructive">
                    {errors.password.message}
                  </FieldDescription>
                ) : (
                  <FieldDescription>
                    Use at least 8 characters with uppercase, lowercase, and a number.
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  {...register("confirmPassword")}
                  disabled={isPending || tokenMissing}
                  aria-invalid={!!errors.confirmPassword}
                />
                {errors.confirmPassword && (
                  <FieldDescription className="text-destructive">
                    {errors.confirmPassword.message}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <Button type="submit" className="w-full" disabled={isPending || tokenMissing}>
                  {isPending ? "Updating password..." : "Update password"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
