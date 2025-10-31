"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { impersonateUserAction, stopImpersonatingAction } from "@/lib/actions/admin-actions";

interface ImpersonateUserButtonProps {
  userId: string;
  userName?: string | null;
  disabled?: boolean;
  returnTo?: string;
}

export function ImpersonateUserButton({
  userId,
  userName,
  disabled,
  returnTo,
}: ImpersonateUserButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={disabled || isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await impersonateUserAction(userId, returnTo);
          if (result?.error) {
            toast.error(result.error);
          }
        })
      }
    >
      {isPending ? "Impersonating..." : "Impersonate"}
    </Button>
  );
}

interface StopImpersonationButtonProps {
  returnTo?: string;
}

export function StopImpersonationButton({ returnTo }: StopImpersonationButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await stopImpersonatingAction(returnTo);
          if (result?.error) {
            toast.error(result.error);
          }
        })
      }
    >
      {isPending ? "Restoring..." : "Return to admin"}
    </Button>
  );
}
