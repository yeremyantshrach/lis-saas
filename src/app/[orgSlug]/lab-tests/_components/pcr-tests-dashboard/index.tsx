"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PcrLabTestRecord } from "@/lib/helpers/lab-tests-helpers";
import { deletePcrTestAction } from "@/lib/actions/lab-test-actions";
import { PCR_TEST_PANELS } from "@/lib/lab-tests/constants";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PathogenStack } from "./pathogen-stack";
import { MarkerStack } from "./marker-stack";
import { PcrTestActionsCell } from "./pcr-test-actions-cell";
import { PcrTestsHeader } from "./pcr-tests-header";
import { PcrTestManagementSheet } from "./pcr-test-management-sheet";
import { PcrTestDeleteDialog } from "./pcr-test-delete-dialog";
import { PcrTestsCardHeader } from "./pcr-tests-card-header";
import { PcrTestsTableSection } from "./pcr-tests-table-section";
import type { PcrTestTableRow } from "./types";

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

  const handleRequestDelete = useCallback(
    (row: PcrTestTableRow) => {
      if (!canDelete) return;
      setDeleteError(null);
      setDeleteTarget(row);
    },
    [canDelete],
  );

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

  const sampleFilterActive = table.getColumn("sampleType")?.getFilterValue();
  const isFiltered = Boolean(globalFilter || panelFilter !== "all" || sampleFilterActive);

  const pagination = table.getState().pagination;
  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const currentPageRowCount = table.getRowModel().rows.length;
  const start = filteredRowCount ? pagination.pageIndex * pagination.pageSize + 1 : 0;
  const end = filteredRowCount ? start + currentPageRowCount - 1 : 0;

  const resetFilters = useCallback(() => {
    table.resetColumnFilters();
    setGlobalFilter("");
    if (panelFilter !== "all") {
      handlePanelFilterChange("all");
    }
  }, [table, panelFilter, handlePanelFilterChange]);

  const handleDeleteDialogChange = useCallback((open: boolean) => {
    if (!open) {
      setDeleteTarget(null);
      setDeleteError(null);
    }
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PcrTestsHeader
        subtitle={headerSubtitle}
        canCreate={canCreate}
        canCreateTest={canCreateTest}
        onCreate={openCreateSheet}
      />

      <PcrTestManagementSheet
        open={isSheetOpen}
        mode={sheetMode}
        onOpenChange={handleSheetOpenChange}
        labs={labs}
        baseLabId={baseLabId}
        formKey={formKey}
        orgSlug={orgSlug}
        showLoincField={showLoincField}
        showCptField={showCptField}
        selectedTest={selectedTest}
        onSuccess={handleFormSuccess}
      />

      {canDelete ? (
        <PcrTestDeleteDialog
          target={deleteTarget}
          error={deleteError}
          isDeleting={isDeleting}
          onOpenChange={handleDeleteDialogChange}
          onConfirm={handleConfirmDelete}
        />
      ) : null}

      <Card>
        <CardHeader className="space-y-4">
          <PcrTestsCardHeader
            table={table}
            globalFilter={globalFilter}
            panelFilter={panelFilter}
            panelOptions={panelOptions}
            sampleTypeOptions={sampleTypeOptions}
            onPanelFilterChange={handlePanelFilterChange}
            isFiltered={isFiltered}
            onResetFilters={resetFilters}
          />
        </CardHeader>
        <CardContent>
          <PcrTestsTableSection
            table={table}
            columnCount={columns.length}
            tableDataLength={tableData.length}
            filteredRowCount={filteredRowCount}
            start={start}
            end={end}
            canCreate={canCreate}
            labsCount={labs.length}
          />
        </CardContent>
      </Card>
    </div>
  );
}
