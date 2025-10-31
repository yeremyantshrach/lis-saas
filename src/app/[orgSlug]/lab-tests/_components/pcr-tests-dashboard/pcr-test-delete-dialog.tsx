import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { PcrTestTableRow } from "./types";

interface PcrTestDeleteDialogProps {
  target: PcrTestTableRow | null;
  error: string | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function PcrTestDeleteDialog({
  target,
  error,
  isDeleting,
  onOpenChange,
  onConfirm,
}: PcrTestDeleteDialogProps) {
  return (
    <AlertDialog open={Boolean(target)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete PCR test</AlertDialogTitle>
          <AlertDialogDescription>
            {target
              ? `This will permanently remove ${target.testName} and its reporting details.`
              : "This will permanently remove the selected test and its reporting details."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
