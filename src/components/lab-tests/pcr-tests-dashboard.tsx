"use client";

import { useMemo, useState } from "react";
import { IconMicroscope, IconPlus } from "@tabler/icons-react";
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { CreatePcrTestForm } from "@/components/lab-tests/create-pcr-test-form";
import type { PcrLabTestRecord } from "@/lib/helpers/lab-tests-helpers";

interface PcrTestsDashboardProps {
  tests: PcrLabTestRecord[];
  labs: { id: string; name: string }[];
  activeLabId: string | null;
  canCreate: boolean;
  orgSlug: string;
  showLoincField?: boolean;
  showCptField?: boolean;
}

type PcrTestTableRow = {
  id: string;
  testName: string;
  testCode: string;
  labName: string;
  panel: string;
  sampleType: string;
  price: number;
  priceDisplay: string;
  pathogenTargets: PcrLabTestRecord["pathogenTargets"];
  resistanceMarkers: PcrLabTestRecord["resistanceMarkers"];
  loincCode: string | null;
  cptCode: string | null;
  defaultClinicalNotes: string | null;
  searchText: string;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const globalSearch: FilterFn<PcrTestTableRow> = (row, _columnId, filterValue) => {
  const query = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!query) return true;
  return row.original.searchText.includes(query);
};

function PathogenStack({ pathogens }: { pathogens: PcrLabTestRecord["pathogenTargets"] }) {
  if (!pathogens.length) return <span>—</span>;

  return (
    <div className="flex flex-col gap-2">
      {pathogens.map((pathogen, index) => (
        <div
          key={`${pathogen.name}-${pathogen.category}-${index}`}
          className="rounded-md border border-border/60 px-2 py-1"
        >
          <div className="text-sm font-semibold leading-none">{pathogen.name}</div>
          <Badge variant="outline" className="mt-1 w-fit text-[11px] font-medium">
            {pathogen.category}
          </Badge>
          {pathogen.clinicalSignificance && (
            <div className="text-xs text-muted-foreground">{pathogen.clinicalSignificance}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function MarkerStack({ markers }: { markers: PcrLabTestRecord["resistanceMarkers"] }) {
  if (!markers.length) return <span>—</span>;

  return (
    <div className="flex flex-col gap-2">
      {markers.map((marker, index) => (
        <div
          key={`${marker.markerName}-${marker.gene}-${index}`}
          className="rounded-md border border-border/60 px-2 py-1"
        >
          <div className="text-sm font-semibold leading-none">
            {marker.markerName}
            {marker.gene ? (
              <span className="text-muted-foreground">{` (${marker.gene})`}</span>
            ) : null}
          </div>
          <Badge variant="outline" className="mt-1 w-fit text-[11px] font-medium">
            {marker.antibioticClass}
          </Badge>
          {marker.clinicalImplication && (
            <div className="text-xs text-muted-foreground">{marker.clinicalImplication}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export function PcrTestsDashboard({
  tests,
  labs,
  activeLabId,
  canCreate,
  orgSlug,
  showLoincField,
  showCptField,
}: PcrTestsDashboardProps) {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const canOpenSheet = canCreate && labs.length > 0;

  const labLookup = useMemo(() => new Map(labs.map((lab) => [lab.id, lab.name])), [labs]);

  const tableData = useMemo<PcrTestTableRow[]>(() => {
    return tests.map((test) => {
      const priceValue = Number.parseFloat(test.price ?? "0");
      const priceNumber = Number.isFinite(priceValue) ? priceValue : 0;
      const priceDisplay = Number.isFinite(priceValue)
        ? currencyFormatter.format(priceNumber)
        : "—";

      const searchText = [
        test.testName,
        test.testCode,
        labLookup.get(test.labId) ?? "",
        test.panel,
        test.sampleType,
        test.loincCode ?? "",
        test.cptCode ?? "",
        test.defaultClinicalNotes ?? "",
        ...test.pathogenTargets.map(
          (p) => `${p.name} ${p.category} ${p.clinicalSignificance ?? ""}`,
        ),
        ...test.resistanceMarkers.map(
          (m) => `${m.markerName} ${m.gene} ${m.antibioticClass} ${m.clinicalImplication ?? ""}`,
        ),
      ]
        .join(" ")
        .toLowerCase();

      return {
        id: test.id,
        testName: test.testName,
        testCode: test.testCode,
        labName: labLookup.get(test.labId) ?? "Unknown lab",
        panel: test.panel,
        sampleType: test.sampleType,
        price: priceNumber,
        priceDisplay,
        pathogenTargets: test.pathogenTargets,
        resistanceMarkers: test.resistanceMarkers,
        loincCode: test.loincCode ?? null,
        cptCode: test.cptCode ?? null,
        defaultClinicalNotes: test.defaultClinicalNotes ?? null,
        searchText,
      } satisfies PcrTestTableRow;
    });
  }, [tests, labLookup]);

  const panelOptions = useMemo(() => {
    const set = new Set(tableData.map((row) => row.panel));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tableData]);

  const sampleTypeOptions = useMemo(() => {
    const set = new Set(tableData.map((row) => row.sampleType));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tableData]);

  const columns = useMemo<ColumnDef<PcrTestTableRow>[]>(() => {
    const base: ColumnDef<PcrTestTableRow>[] = [
      {
        accessorKey: "testName",
        header: "Test",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold leading-tight">{row.original.testName}</span>
            <span className="text-xs text-muted-foreground">{row.original.testCode}</span>
          </div>
        ),
      },
      {
        accessorKey: "labName",
        header: "Lab",
      },
      {
        accessorKey: "panel",
        header: "Panel",
        cell: ({ row }) => <Badge variant="outline">{row.original.panel}</Badge>,
      },
      {
        accessorKey: "sampleType",
        header: "Sample Type",
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => <span>{row.original.priceDisplay}</span>,
      },
      {
        accessorKey: "pathogenTargets",
        header: "Pathogen Targets",
        enableSorting: false,
        cell: ({ row }) => <PathogenStack pathogens={row.original.pathogenTargets} />,
      },
      {
        accessorKey: "resistanceMarkers",
        header: "Resistance Markers",
        enableSorting: false,
        cell: ({ row }) => <MarkerStack markers={row.original.resistanceMarkers} />,
      },
    ];

    if (showLoincField) {
      base.push({
        accessorKey: "loincCode",
        header: "LOINC",
        cell: ({ row }) => <span>{row.original.loincCode ?? "—"}</span>,
      });
    }

    if (showCptField) {
      base.push({
        accessorKey: "cptCode",
        header: "CPT",
        cell: ({ row }) => <span>{row.original.cptCode ?? "—"}</span>,
      });
    }

    base.push({
      accessorKey: "defaultClinicalNotes",
      header: "Default Notes",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.defaultClinicalNotes ?? "—"}
        </span>
      ),
    });

    return base;
  }, [showLoincField, showCptField]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: globalSearch,
    initialState: { pagination: { pageSize: 10 } },
  });

  const headerSubtitle =
    labs.length > 1
      ? "Browse PCR assays across your labs, grouped by the teams that own them."
      : "Browse PCR assays available to your lab team.";

  const panelColumn = table.getColumn("panel");
  const sampleColumn = table.getColumn("sampleType");
  const isFiltered = Boolean(
    globalFilter || panelColumn?.getFilterValue() || sampleColumn?.getFilterValue(),
  );

  const pagination = table.getState().pagination;
  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const visibleRows = table.getRowModel().rows;
  const start = filteredRowCount ? pagination.pageIndex * pagination.pageSize + 1 : 0;
  const end = filteredRowCount ? start + visibleRows.length - 1 : 0;

  const resetFilters = () => {
    table.resetColumnFilters();
    setGlobalFilter("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">PCR Test Catalog</h1>
          <p className="text-muted-foreground">{headerSubtitle}</p>
        </div>
        {canOpenSheet ? (
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                New PCR Test
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex h-full w-full flex-col overflow-hidden sm:max-w-5xl lg:max-w-6xl"
            >
              <SheetHeader>
                <SheetTitle>Create PCR Test</SheetTitle>
                <SheetDescription>
                  Capture the metadata your team needs to order, price, and report this assay
                  consistently.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-6 pb-6">
                <CreatePcrTestForm
                  labs={labs}
                  defaultLabId={activeLabId ?? labs[0]?.id}
                  orgSlug={orgSlug}
                  showLoincField={showLoincField}
                  showCptField={showCptField}
                  onSuccess={() => setSheetOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
        ) : canCreate ? (
          <Button disabled>Create PCR Test</Button>
        ) : null}
      </div>

      <Card>
        <CardHeader className="space-y-4">
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
              <Select
                value={(panelColumn?.getFilterValue() as string) ?? "all"}
                onValueChange={(value) =>
                  panelColumn?.setFilterValue(value === "all" ? undefined : value)
                }
              >
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
                value={(sampleColumn?.getFilterValue() as string) ?? "all"}
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
              {isFiltered && (
                <Button variant="ghost" onClick={resetFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tableData.length === 0 ? (
            <Empty className="mt-6">
              <EmptyMedia variant="icon">
                <IconMicroscope className="h-6 w-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No PCR tests yet</EmptyTitle>
                <EmptyDescription>
                  Start capturing your assay catalog so orders and billing stay consistent.{" "}
                  {canOpenSheet
                    ? "Use the button above to add your first test."
                    : canCreate
                      ? "Add your first lab to begin creating tests."
                      : ""}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <p className="text-sm text-muted-foreground">
                  Document panel, sample type, and reference notes up front—no more scrambling
                  during accessioning.
                </p>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} className="align-top">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {visibleRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={columns.length}>
                          <Empty>
                            <EmptyHeader>
                              <EmptyTitle>No tests match your filters</EmptyTitle>
                              <EmptyDescription>
                                Try adjusting your filters or clearing the search to see everything
                                again.
                              </EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleRows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="align-top">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {filteredRowCount === 0
                    ? "No tests to display"
                    : `Showing ${start}-${end} of ${filteredRowCount} ${
                        filteredRowCount === 1 ? "test" : "tests"
                      }`}
                  {filteredRowCount !== tableData.length
                    ? ` (filtered from ${tableData.length})`
                    : ""}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
