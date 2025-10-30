"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ComponentProps, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signinSchema, type SigninFormData } from "@/lib/validations/auth";
import { signinAction } from "@/app/(public-layout)/(auth)/sign-in/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, KeyRound } from "lucide-react";

interface SignInFormProps extends ComponentProps<"div"> {
  invitationId?: string;
  isEmailVerified?: boolean;
  passwordResetSuccess?: boolean;
}

export function SignInForm({
  className,
  invitationId,
  isEmailVerified,
  passwordResetSuccess,
  ...props
}: SignInFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: SigninFormData) => {
    startTransition(async () => {
      const result = await signinAction(data);

      if (!result.success) {
        // Handle field-specific errors
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              setError(field as keyof SigninFormData, {
                type: "manual",
                message: messages[0],
              });
            }
          });
        }
        // Show error toast
        toast.error(result.error || "Failed to sign in");
        if (result.redirectUrl) {
          router.push(result.redirectUrl);
        }
      } else {
        toast.success(result.message || "Signed in successfully!");

        if (invitationId) {
          router.push(`/invite/${encodeURIComponent(invitationId)}`);
          return;
        }

        if (result.redirectUrl) {
          // todo: understand why router.push is nor invalidating dashboard cache
          window.location.href = result.redirectUrl;
        } else {
          router.refresh();
        }
      }
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(isEmailVerified || passwordResetSuccess) && (
            <div className="space-y-3">
              {isEmailVerified && (
                <Alert>
                  <CheckCircle2 className="text-emerald-600" />
                  <AlertTitle>Email verified</AlertTitle>
                  <AlertDescription>
                    Your email address is confirmed. You can sign in with your credentials below.
                  </AlertDescription>
                </Alert>
              )}
              {passwordResetSuccess && (
                <Alert>
                  <KeyRound className="text-primary" />
                  <AlertTitle>Password updated</AlertTitle>
                  <AlertDescription>
                    Your password was reset successfully. Use the form below to access your account.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)}>
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
                {errors.email && (
                  <FieldDescription className="text-destructive">
                    {errors.email.message}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  disabled={isPending}
                  aria-invalid={!!errors.password}
                />
                {errors.password && (
                  <FieldDescription className="text-destructive">
                    {errors.password.message}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Signing in..." : "Login"}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <Link
                    href={
                      invitationId
                        ? `/sign-up?invitationId=${encodeURIComponent(invitationId)}`
                        : "/sign-up"
                    }
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Sign up
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
