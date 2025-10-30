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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { type Lab } from "@/lib/auth-client";
import { updateMemberSchema } from "@/lib/validations/members";
import { updateMemberAction } from "@/lib/actions/member-actions";

interface EditMemberFormProps {
  memberId: string;
  currentRole: string;
  currentTeamId?: string | null;
  memberName?: string | null;
  memberEmail: string;
  labs: Lab[];
  canChangeRole: boolean;
  canChangeTeam: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditMemberForm({
  memberId,
  currentRole,
  currentTeamId,
  memberName,
  memberEmail,
  labs,
  canChangeRole,
  canChangeTeam,
  onSuccess,
  onCancel,
}: EditMemberFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof updateMemberSchema>>({
    resolver: zodResolver(updateMemberSchema),
    defaultValues: {
      memberId,
      role: currentRole,
      teamId: currentTeamId || undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof updateMemberSchema>) {
    setIsLoading(true);
    try {
      const result = await updateMemberAction(values);
      if (result.success) {
        onSuccess?.();
      } else {
        form.setError("root", { message: result.error });
      }
    } catch {
      form.setError("root", { message: "Something went wrong" });
    } finally {
      setIsLoading(false);
    }
  }

  const sortedLabs = [...labs].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Member Information</h3>
          <div className="rounded-md border p-3 text-sm">
            <div className="font-medium">{memberName || memberEmail}</div>
            <div className="text-xs text-muted-foreground">{memberEmail}</div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!canChangeRole || isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="org-owner">Organization Owner</SelectItem>
                  <SelectItem value="lab-admin">Lab Admin</SelectItem>
                  <SelectItem value="lab-cls">Clinical Laboratory Scientist</SelectItem>
                  <SelectItem value="lab-technician">Laboratory Technician</SelectItem>
                  <SelectItem value="lab-doctor">Laboratory Doctor</SelectItem>
                  <SelectItem value="lab-receptionist">Lab Receptionist</SelectItem>
                </SelectContent>
              </Select>
              {!canChangeRole && (
                <FormDescription>
                  You don&apos;t have permission to change member roles.
                </FormDescription>
              )}
              {canChangeRole && (
                <FormDescription>
                  Assign the level of access this member should receive.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {canChangeTeam && sortedLabs.length > 0 && (
          <FormField
            control={form.control}
            name="teamId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign to Lab</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
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
                <FormDescription>Change which lab this member is assigned to.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {form.formState.errors.root && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
