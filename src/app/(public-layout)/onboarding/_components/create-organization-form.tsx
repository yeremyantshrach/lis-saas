"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ComponentProps, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createOrganizationSchema,
  type CreateOrganizationFormData,
} from "@/lib/validations/organization";
import { createOrganizationAction } from "../actions";
import { toast } from "sonner";

export function CreateOrganizationForm({ className, ...props }: ComponentProps<"div">) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: CreateOrganizationFormData) => {
    startTransition(async () => {
      const result = await createOrganizationAction(data);

      if (!result.success) {
        // Handle field-specific errors
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              setError(field as keyof CreateOrganizationFormData, {
                type: "manual",
                message: messages[0],
              });
            }
          });
        }

        // Show error toast
        toast.error(result.message || "Failed to create organization");
      } else {
        // Show success toast
        toast.success(result.message || "Organization created successfully!");
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
        }
        // Redirect will happen automatically via server action
        // No need to manually redirect here since the action calls redirect()
      }
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Create Your Organization</CardTitle>
          <CardDescription>
            Get started by creating your organization. You can always change this later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Organization Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Acme Inc."
                  {...register("name")}
                  disabled={isPending}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <FieldDescription className="text-destructive">
                    {errors.name.message}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Organization"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
