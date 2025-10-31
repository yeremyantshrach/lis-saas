import { Button } from "@/components/ui/button";
import type { PcrTestTableRow } from "./types";

interface PcrTestActionsCellProps {
  row: PcrTestTableRow;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (id: string) => void;
  onDelete: (row: PcrTestTableRow) => void;
}

export function PcrTestActionsCell({
  row,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: PcrTestActionsCellProps) {
  if (!canEdit && !canDelete) {
    return <span className="text-sm text-muted-foreground">No actions available</span>;
  }

  return (
    <div className="flex items-center gap-2">
      {canEdit ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(row.id)}
          aria-label={`Edit ${row.testName}`}
        >
          Edit
        </Button>
      ) : null}
      {canDelete ? (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(row)}
          aria-label={`Delete ${row.testName}`}
        >
          Delete
        </Button>
      ) : null}
    </div>
  );
}
