"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteToOrgAction } from "@/lib/actions/lab-actions";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { inviteSchema } from "@/lib/validations/labs";
import { type Lab } from "@/lib/auth-client";
import Link from "next/link";

interface InviteFormProps {
  orgSlug: string;
  labs: Lab[];
}

export function InviteForm({ orgSlug, labs }: InviteFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const sortedLabs = useMemo(
    () =>
      [...labs].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    [labs],
  );
  const hasLabs = sortedLabs.length > 0;

  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "lab-admin",
      teamId: hasLabs ? sortedLabs[0].id : "",
    },
  });

  useEffect(() => {
    if (sortedLabs.length) {
      form.setValue("teamId", sortedLabs[0].id);
    }
  }, [sortedLabs, form]);

  async function onSubmit(values: z.infer<typeof inviteSchema>) {
    setIsLoading(true);
    try {
      const result = await inviteToOrgAction(values);
      if (result.success) {
        router.push(`/${orgSlug}/labs?tab=members`);
      } else {
        form.setError("root", { message: result.error });
      }
    } catch (error) {
      form.setError("root", { message: "Something went wrong" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!hasLabs && (
          <div className="flex flex-col gap-3 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            <p>Create a lab before inviting team members.</p>
            <Button asChild variant="outline" size="sm">
              <Link href={`/${orgSlug}/labs`}>Create a lab</Link>
            </Button>
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="lab-admin">Lab Admin</SelectItem>
                  <SelectItem value="lab-cls">Clinical Laboratory Scientist</SelectItem>
                  <SelectItem value="lab-tech">Laboratory Technician</SelectItem>
                  <SelectItem value="lab-doctor">Laboratory Doctor</SelectItem>
                  <SelectItem value="lab-receptionist">Lab Receptionist</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Assign the level of access this teammate should receive.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="teamId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign to Lab</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!hasLabs || sortedLabs.length <= 1}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a lab" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sortedLabs.map((lab) => (
                    <SelectItem key={lab.id} value={lab.id}>
                      {lab.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                New members will see this lab as soon as they accept the invite.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <div className="text-sm text-destructive">{form.formState.errors.root.message}</div>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={isLoading || !hasLabs}>
            {isLoading ? "Sending..." : "Send Invitation"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
