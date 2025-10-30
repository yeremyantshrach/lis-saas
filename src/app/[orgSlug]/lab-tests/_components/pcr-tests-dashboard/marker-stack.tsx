import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PcrLabTestRecord } from "@/lib/helpers/lab-tests-helpers";

interface MarkerStackProps {
  markers: PcrLabTestRecord["resistanceMarkers"];
}

export function MarkerStack({ markers }: MarkerStackProps) {
  if (!markers.length) return <span>—</span>;

  const previewLimit = 2;
  const preview = markers.slice(0, previewLimit);
  const remaining = Math.max(markers.length - previewLimit, 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {preview.map((marker, index) => (
        <Badge key={`${marker.markerName}-${marker.gene}-${index}`} variant="secondary">
          {marker.markerName}
        </Badge>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs font-medium"
            aria-label="View resistance marker details"
          >
            {remaining > 0 ? `+${remaining} more` : "View"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 max-h-80 space-y-3 overflow-y-auto">
          {markers.map((marker, index) => (
            <div
              key={`${marker.markerName}-${marker.gene}-${index}`}
              className="rounded-md border border-border/60 p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="font-medium leading-tight">
                  {marker.markerName}
                  {marker.gene ? (
                    <span className="text-muted-foreground">{` (${marker.gene})`}</span>
                  ) : null}
                </div>
                <Badge variant="outline" className="text-[11px] font-medium">
                  {marker.antibioticClass}
                </Badge>
              </div>
              {marker.clinicalImplication ? (
                <p className="mt-2 text-sm text-muted-foreground">{marker.clinicalImplication}</p>
              ) : null}
            </div>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}
