"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { deletePcrTestAction } from "@/lib/actions/lab-test-actions";
import { PCR_TEST_PANELS } from "@/lib/lab-tests/constants";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface PcrTestsDashboardProps {
  tests: PcrLabTestRecord[];
  labs: { id: string; name: string }[];
  activeLabId: string | null;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  orgSlug: string;
  showLoincField?: boolean;
  showCptField?: boolean;
}

type PcrTestTableRow = {
  id: string;
  labId: string;
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

function PcrTestActionsCell({
  row,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  row: PcrTestTableRow;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (id: string) => void;
  onDelete: (row: PcrTestTableRow) => void;
}) {
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

function MarkerStack({ markers }: { markers: PcrLabTestRecord["resistanceMarkers"] }) {
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

export function PcrTestsDashboard({
  tests,
  labs,
  activeLabId,
  canCreate,
  canUpdate,
  canDelete,
  orgSlug,
  showLoincField,
  showCptField,
}: PcrTestsDashboardProps) {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [selectedTest, setSelectedTest] = useState<PcrLabTestRecord | null>(null);
  const [formKey, setFormKey] = useState<string>("create");
  const canCreateTest = canCreate && labs.length > 0;
  const baseLabId = activeLabId ?? labs[0]?.id ?? null;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [deleteTarget, setDeleteTarget] = useState<PcrTestTableRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const initialPanelParam = searchParams.get("panel");
  const initialPanelFilter =
    initialPanelParam &&
    PCR_TEST_PANELS.includes(initialPanelParam as (typeof PCR_TEST_PANELS)[number])
      ? initialPanelParam
      : "all";
  const [panelFilter, setPanelFilter] = useState<string>(initialPanelFilter);

  useEffect(() => {
    const param = searchParams.get("panel");
    const normalized =
      param && PCR_TEST_PANELS.includes(param as (typeof PCR_TEST_PANELS)[number]) ? param : "all";
    setPanelFilter((prev) => (prev === normalized ? prev : normalized));
  }, [searchParams]);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setSheetMode("create");
      setSelectedTest(null);
      setFormKey(`create-${Date.now()}`);
    }
  }, []);

  const openCreateSheet = useCallback(() => {
    if (!canCreateTest) return;
    setSheetMode("create");
    setSelectedTest(null);
    setFormKey(`create-${Date.now()}`);
    setSheetOpen(true);
  }, [canCreateTest]);

  const openEditSheet = useCallback(
    (testId: string) => {
      if (!canUpdate) return;
      const match = tests.find((item) => item.id === testId);
      if (!match) return;
      setSheetMode("edit");
      setSelectedTest(match);
      setFormKey(`edit-${match.id}-${Date.now()}`);
      setSheetOpen(true);
    },
    [tests, canUpdate],
  );

  const handleFormSuccess = useCallback(() => {
    setSheetOpen(false);
    setSheetMode("create");
    setSelectedTest(null);
    setFormKey(`create-${Date.now()}`);
  }, []);

  const handlePanelFilterChange = useCallback(
    (value: string) => {
      setPanelFilter(value);
      if (!pathname) return;
      const next = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        next.delete("panel");
      } else {
        next.set("panel", value);
      }
      const queryString = next.toString();
      router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleRequestDelete = useCallback((row: PcrTestTableRow) => {
    if (!canDelete) return;
    setDeleteError(null);
    setDeleteTarget(row);
  }, [canDelete]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget || !canDelete) return;
    startDelete(async () => {
      setDeleteError(null);
      const result = await deletePcrTestAction({
        id: deleteTarget.id,
        labId: deleteTarget.labId,
        orgSlug,
      });

      if (result.success) {
        setDeleteTarget(null);
        router.refresh();
      } else if (result.errors) {
        const fallback = Object.values(result.errors)[0]?.[0];
        setDeleteError(fallback ?? "Unable to delete test.");
      } else if (result.error) {
        setDeleteError(result.error);
      } else {
        setDeleteError("Unable to delete test.");
      }
    });
  }, [deleteTarget, orgSlug, router, canDelete]);

  const labLookup = useMemo(() => new Map(labs.map((lab) => [lab.id, lab.name])), [labs]);

  const filteredTests = useMemo(() => {
    if (panelFilter === "all") return tests;
    return tests.filter((test) => test.panel === panelFilter);
  }, [tests, panelFilter]);

  const tableData = useMemo<PcrTestTableRow[]>(() => {
    return filteredTests.map((test) => {
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
        test.description ?? "",
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
        labId: test.labId,
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
  }, [filteredTests, labLookup]);

  const panelOptions = useMemo(() => {
    const set = new Set(tests.map((test) => test.panel));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tests]);

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

    if (canUpdate || canDelete) {
      base.push({
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <PcrTestActionsCell
            row={row.original}
            canEdit={canUpdate}
            canDelete={canDelete}
            onEdit={openEditSheet}
            onDelete={handleRequestDelete}
          />
        ),
      });
    }

    return base;
  }, [showLoincField, showCptField, canUpdate, canDelete, openEditSheet, handleRequestDelete]);

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

  const sampleColumn = table.getColumn("sampleType");
  const isFiltered = Boolean(
    globalFilter || panelFilter !== "all" || sampleColumn?.getFilterValue(),
  );

  const pagination = table.getState().pagination;
  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const visibleRows = table.getRowModel().rows;
  const start = filteredRowCount ? pagination.pageIndex * pagination.pageSize + 1 : 0;
  const end = filteredRowCount ? start + visibleRows.length - 1 : 0;

  const resetFilters = () => {
    table.resetColumnFilters();
    setGlobalFilter("");
    if (panelFilter !== "all") {
      handlePanelFilterChange("all");
    }
  };

  const sheetTitle = sheetMode === "edit" ? "Edit PCR Test" : "Create PCR Test";
  const sheetDescription =
    sheetMode === "edit"
      ? "Update the identifiers, pricing, and interpretation details for this assay."
      : "Capture the metadata your team needs to order, price, and report this assay consistently.";
  const formDefaultLabId = sheetMode === "edit" ? (selectedTest?.labId ?? baseLabId) : baseLabId;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">PCR Test Catalog</h1>
          <p className="text-muted-foreground">{headerSubtitle}</p>
        </div>
        {canCreate ? (
          <Button onClick={openCreateSheet} disabled={!canCreateTest}>
            <IconPlus className="mr-2 h-4 w-4" />
            New PCR Test
          </Button>
        ) : null}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
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
              defaultLabId={formDefaultLabId}
              orgSlug={orgSlug}
              showLoincField={showLoincField}
              showCptField={showCptField}
              mode={sheetMode}
              initialData={sheetMode === "edit" ? selectedTest : null}
              onSuccess={handleFormSuccess}
            />
          </div>
        </SheetContent>
      </Sheet>

      {canDelete ? (
        <AlertDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteTarget(null);
              setDeleteError(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete PCR test</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget
                  ? `This will permanently remove ${deleteTarget.testName} and its reporting details.`
                  : "This will permanently remove the selected test and its reporting details."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isDeleting}
                onClick={(event) => {
                  event.preventDefault();
                  handleConfirmDelete();
                }}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

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
              <Select value={panelFilter} onValueChange={handlePanelFilterChange}>
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
                  {canCreate
                    ? labs.length > 0
                      ? "Use the button above to add your first test."
                      : "Add your first lab to begin creating tests."
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
