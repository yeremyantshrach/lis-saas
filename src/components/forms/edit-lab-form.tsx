"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTransition } from "react";
import { createLabSchema } from "@/lib/validations/labs";
import { updateLabAction } from "@/lib/actions/update-lab-action";
import { Lab } from "@/lib/auth-client";

interface EditLabFormProps {
  lab: Lab;
  onSuccess?: () => void;
}

export function EditLabForm({ lab, onSuccess }: EditLabFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof createLabSchema>>({
    resolver: zodResolver(createLabSchema),
    defaultValues: {
      name: lab.name,
    },
  });

  function onSubmit(values: z.infer<typeof createLabSchema>) {
    startTransition(async () => {
      try {
        const result = await updateLabAction(lab.id, values);
        if (result.success) {
          onSuccess?.();
        } else {
          form.setError("root", { message: result.error });
        }
      } catch (error) {
        form.setError("root", { message: "Something went wrong" });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lab Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter lab name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <div className="text-sm text-destructive">{form.formState.errors.root.message}</div>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Updating..." : "Update Lab"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
