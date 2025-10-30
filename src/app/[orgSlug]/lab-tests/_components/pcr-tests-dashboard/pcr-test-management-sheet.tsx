import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CreatePcrTestForm } from "@/components/lab-tests/create-pcr-test-form";
import type { PcrLabTestRecord } from "@/lib/helpers/lab-tests-helpers";

interface PcrTestManagementSheetProps {
  open: boolean;
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  labs: { id: string; name: string }[];
  baseLabId: string | null;
  formKey: string;
  orgSlug: string;
  showLoincField?: boolean;
  showCptField?: boolean;
  selectedTest: PcrLabTestRecord | null;
  onSuccess: () => void;
}

export function PcrTestManagementSheet({
  open,
  mode,
  onOpenChange,
  labs,
  baseLabId,
  formKey,
  orgSlug,
  showLoincField,
  showCptField,
  selectedTest,
  onSuccess,
}: PcrTestManagementSheetProps) {
  const sheetTitle = mode === "edit" ? "Edit PCR Test" : "Create PCR Test";
  const sheetDescription =
    mode === "edit"
      ? "Update the identifiers, pricing, and interpretation details for this assay."
      : "Capture the metadata your team needs to order, price, and report this assay consistently.";
  const defaultLabId = mode === "edit" ? (selectedTest?.labId ?? baseLabId) : baseLabId;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col overflow-hidden sm:max-w-5xl lg:max-w-6xl"
      >
        <SheetHeader>
          <SheetTitle>{sheetTitle}</SheetTitle>
          <SheetDescription>{sheetDescription}</SheetDescription>
        </SheetHeader>
        <div className="mt-6 flex-1 overflow-y-auto px-6 pb-1">
          <CreatePcrTestForm
            key={formKey}
            labs={labs}
            defaultLabId={defaultLabId}
            orgSlug={orgSlug}
            showLoincField={showLoincField}
            showCptField={showCptField}
            mode={mode}
            initialData={mode === "edit" ? selectedTest : null}
            onSuccess={onSuccess}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
