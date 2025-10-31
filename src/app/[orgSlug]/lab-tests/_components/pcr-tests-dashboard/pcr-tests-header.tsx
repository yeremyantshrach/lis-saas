import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface PcrTestsHeaderProps {
  subtitle: string;
  canCreate: boolean;
  canCreateTest: boolean;
  onCreate: () => void;
}

export function PcrTestsHeader({
  subtitle,
  canCreate,
  canCreateTest,
  onCreate,
}: PcrTestsHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold">PCR Test Catalog</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      {canCreate ? (
        <Button onClick={onCreate} disabled={!canCreateTest}>
          <IconPlus className="mr-2 h-4 w-4" />
          New PCR Test
        </Button>
      ) : null}
    </div>
  );
}
