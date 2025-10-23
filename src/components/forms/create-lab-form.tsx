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
import { createLabAction } from "@/lib/actions/lab-actions";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createLabSchema } from "@/lib/validations/labs";

interface CreateLabFormProps {
  onClose: () => void;
}

export function CreateLabForm({ onClose }: CreateLabFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof createLabSchema>>({
    resolver: zodResolver(createLabSchema),
    defaultValues: {
      name: "",
    },
  });

  function onSubmit(values: z.infer<typeof createLabSchema>) {
    startTransition(async () => {
      try {
        const result = await createLabAction(values);
        if (result.success) {
          router.refresh();
          onClose();
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
            {isPending ? "Creating..." : "Create Lab"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
