import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Table as TanstackTable } from "@tanstack/react-table";
import type { PcrTestTableRow } from "./types";

interface PcrTestsCardHeaderProps {
  table: TanstackTable<PcrTestTableRow>;
  globalFilter: string;
  panelFilter: string;
  panelOptions: string[];
  sampleTypeOptions: string[];
  onPanelFilterChange: (value: string) => void;
  isFiltered: boolean;
  onResetFilters: () => void;
}

export function PcrTestsCardHeader({
  table,
  globalFilter,
  panelFilter,
  panelOptions,
  sampleTypeOptions,
  onPanelFilterChange,
  isFiltered,
  onResetFilters,
}: PcrTestsCardHeaderProps) {
  const sampleColumn = table.getColumn("sampleType");
  const sampleFilterValue = (sampleColumn?.getFilterValue() as string | undefined) ?? "all";

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1">
        <CardTitle>PCR Tests</CardTitle>
        <CardDescription>
          Each entry includes pricing, sample requirements, pathogens, and resistance markers.
        </CardDescription>
      </div>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <Input
          value={globalFilter}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          placeholder="Search tests, labs, pathogens..."
          className="lg:w-[240px]"
        />
        <Select value={panelFilter} onValueChange={onPanelFilterChange}>
          <SelectTrigger className="lg:w-[180px]">
            <SelectValue placeholder="Panel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All panels</SelectItem>
            {panelOptions.map((panel) => (
              <SelectItem key={panel} value={panel}>
                {panel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sampleFilterValue}
          onValueChange={(value) =>
            sampleColumn?.setFilterValue(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="lg:w-[180px]">
            <SelectValue placeholder="Sample type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All samples</SelectItem>
            {sampleTypeOptions.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isFiltered ? (
          <Button variant="ghost" onClick={onResetFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
