import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PcrLabTestRecord } from "@/lib/helpers/lab-tests-helpers";

interface PathogenStackProps {
  pathogens: PcrLabTestRecord["pathogenTargets"];
}

export function PathogenStack({ pathogens }: PathogenStackProps) {
  if (!pathogens.length) return <span>—</span>;

  const previewLimit = 2;
  const preview = pathogens.slice(0, previewLimit);
  const remaining = Math.max(pathogens.length - previewLimit, 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {preview.map((pathogen, index) => (
        <Badge key={`${pathogen.name}-${pathogen.category}-${index}`} variant="secondary">
          {pathogen.name}
        </Badge>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs font-medium"
            aria-label="View pathogen details"
          >
            {remaining > 0 ? `+${remaining} more` : "View"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 max-h-80 space-y-3 overflow-y-auto">
          {pathogens.map((pathogen, index) => (
            <div
              key={`${pathogen.name}-${pathogen.category}-${index}`}
              className="rounded-md border border-border/60 p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="font-medium leading-tight">{pathogen.name}</div>
                <Badge variant="outline" className="text-[11px] font-medium">
                  {pathogen.category}
                </Badge>
              </div>
              {pathogen.clinicalSignificance ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {pathogen.clinicalSignificance}
                </p>
              ) : null}
            </div>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}
