"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  IconAlertCircle,
  IconBuildingHospital,
  IconSearch,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react";
import { differenceInDays, differenceInYears, format, formatDistanceToNow } from "date-fns";
import {
  ColumnDef,
  PaginationState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PatientStatusBadge } from "./patient-status-badge";
import type { LabPatientListItem } from "@/lib/helpers/patient-helpers";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "archived", label: "Archived" },
] as const;

interface PatientsDashboardProps {
  patients: LabPatientListItem[];
  labs: { id: string; name: string }[];
  selectedLabId?: string | null;
  canCreate: boolean;
  canUpdate: boolean;
  orgSlug: string;
}

export function PatientsDashboard({
  patients,
  labs,
  selectedLabId,
  canCreate,
  canUpdate,
  orgSlug,
}: PatientsDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [isNavigating, startTransition] = useTransition();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const normalizedQuery = query.trim().toLowerCase();

  const filteredPatients = useMemo(() => {
    return patients
      .filter((patient) => {
        if (statusFilter === "all") return true;
        return patient.status === statusFilter;
      })
      .filter((patient) => {
        if (!normalizedQuery) return true;
        const haystack = [
          patient.legalFirstName,
          patient.legalLastName,
          patient.primaryPhone,
          patient.email ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      });
  }, [patients, statusFilter, normalizedQuery]);
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [filteredPatients.length, pagination.pageSize]);

  useEffect(() => {
    const maxPageIndex = Math.max(0, Math.ceil(filteredPatients.length / pagination.pageSize) - 1);
    if (pagination.pageIndex > maxPageIndex) {
      setPagination((prev) => ({ ...prev, pageIndex: maxPageIndex }));
    }
  }, [filteredPatients.length, pagination.pageIndex, pagination.pageSize]);

  const tableColumns = useMemo<ColumnDef<LabPatientListItem>[]>(
    () => [
      {
        id: "patient",
        header: "Patient",
        cell: ({ row }) => {
          const patient = row.original;
          return (
            <div className="min-w-[200px] space-y-1">
              <div className="font-medium leading-tight">
                {patient.legalFirstName} {patient.legalLastName}
              </div>
              {patient.labName ? (
                <Badge variant="outline" className="w-fit text-xs">
                  {patient.labName}
                </Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "demographics",
        header: "DOB & Gender",
        cell: ({ row }) => {
          const patient = row.original;
          const age = differenceInYears(new Date(), patient.dateOfBirth);
          const genderLabel = patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1);
          return (
            <div className="space-y-1 text-sm">
              <p>{format(patient.dateOfBirth, "PPP")}</p>
              <p className="text-muted-foreground">
                Age {age} · {genderLabel}
              </p>
            </div>
          );
        },
      },
      {
        id: "contact",
        header: "Contact",
        cell: ({ row }) => {
          const patient = row.original;
          return (
            <div className="space-y-1 text-sm">
              <p>{patient.primaryPhone}</p>
              {patient.email ? (
                <p className="text-muted-foreground">{patient.email}</p>
              ) : (
                <p className="text-muted-foreground">No email on file</p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "primaryMedicalOfficeName",
        header: "Medical Office",
        cell: ({ row }) => {
          const office = row.original.primaryMedicalOfficeName;
          return (
            <div className="text-sm">
              {office ? (
                <span>{office}</span>
              ) : (
                <span className="text-muted-foreground">Not specified</span>
              )}
            </div>
          );
        },
      },
      {
        id: "coverage",
        header: "Insurance",
        cell: ({ row }) => {
          const providers = row.original.insuranceProviders ?? [];
          return (
            <div className="text-sm">
              {providers.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {providers.map((provider) => (
                    <Badge key={provider} variant="outline" className="text-xs">
                      {provider}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">Pending coverage</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <PatientStatusBadge status={row.original.status} />,
      },
      {
        id: "activity",
        header: "Profile Details",
        cell: ({ row }) => {
          const patient = row.original;
          const lastInteraction = patient.lastAccessedAt ?? patient.connectedAt;
          const billing = patient.primaryMedicalOfficeName
            ? `Office: ${patient.primaryMedicalOfficeName}`
            : "Office not set";
          const insurance =
            patient.insuranceProviders && patient.insuranceProviders.length > 0
              ? `Insurance: ${patient.insuranceProviders.join(", ")}`
              : "Insurance: Pending";
          return (
            <div>
              <div className="text-xs text-muted-foreground">{billing}</div>
              <div className="text-xs text-muted-foreground">{insurance}</div>
              <div className="mt-1 text-sm text-foreground">
                Last activity {formatDistanceToNow(new Date(lastInteraction), { addSuffix: true })}
              </div>
              <div className="text-xs text-muted-foreground">
                Connected {format(patient.connectedAt, "PP")}
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button variant="ghost" size="sm" asChild disabled={!canUpdate}>
              <Link href={`/${orgSlug}/patients/${row.original.patientId}/edit`}>Manage</Link>
            </Button>
          </div>
        ),
      },
    ],
    [canUpdate, orgSlug],
  );

  const table = useReactTable({
    data: filteredPatients,
    columns: tableColumns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  const rowModel = table.getRowModel();
  const paginatedRows = rowModel.rows;
  const filteredCount = filteredPatients.length;
  const from = filteredCount ? pagination.pageIndex * pagination.pageSize + 1 : 0;
  const to = filteredCount
    ? Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredCount)
    : 0;
  const resultsLabel = filteredCount
    ? `Showing ${from}-${to} of ${filteredCount} patients`
    : "No patients match the filters";

  const totalPatients = patients.length;
  const activePatients = patients.filter((patient) => patient.status === "active").length;
  const newThisMonth = patients.filter(
    (patient) => differenceInDays(new Date(), patient.connectedAt) <= 30,
  ).length;

  const handleLabChange = (value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (value) {
        params.set("labId", value);
      } else {
        params.delete("labId");
      }
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  if (labs.length === 0) {
    return (
      <Empty className="mt-10">
        <EmptyMedia variant="icon">
          <IconBuildingHospital className="h-8 w-8" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No labs available yet</EmptyTitle>
          <EmptyDescription>
            Add a lab before registering patients so data stays scoped to the right team.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={`/${orgSlug}/labs`}>Go to Labs</Link>
        </Button>
      </Empty>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">
            Centralize patient demographics, coverage, and documents per lab.
          </p>
        </div>
        {canCreate && (
          <Button asChild disabled={isNavigating}>
            <Link href={`/${orgSlug}/patients/new`}>
              <IconUserPlus className="mr-2 h-4 w-4" />
              New Patient
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total patients</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalPatients}</div>
            <CardDescription>Across the selected lab.</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <IconAlertCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{activePatients}</div>
            <CardDescription>Eligible for new orders.</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected this month</CardTitle>
            <IconBuildingHospital className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{newThisMonth}</div>
            <CardDescription>Patients added within 30 days.</CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="lab-select">Lab</Label>
            <Select value={selectedLabId ?? undefined} onValueChange={handleLabChange}>
              <SelectTrigger id="lab-select">
                <SelectValue placeholder="Select a lab" />
              </SelectTrigger>
              <SelectContent>
                {labs.map((lab) => (
                  <SelectItem key={lab.id} value={lab.id}>
                    {lab.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="patient-search">Search</Label>
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="patient-search"
                placeholder="Search by name, phone, or email"
                className="pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Tabs
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
          >
            <TabsList className="w-full justify-start overflow-x-auto">
              {STATUS_FILTERS.map((filter) => (
                <TabsTrigger key={filter.id} value={filter.id} className="text-xs sm:text-sm">
                  {filter.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="space-y-4">
        {filteredCount === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No patients match the filters</EmptyTitle>
              <EmptyDescription>Adjust your search or add a new patient.</EmptyDescription>
            </EmptyHeader>
            {canCreate && (
              <Button asChild size="sm">
                <Link href={`/${orgSlug}/patients/new`}>Create patient</Link>
              </Button>
            )}
          </Empty>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {paginatedRows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <div>{resultsLabel}</div>
              <div className="flex items-center justify-end gap-2">
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
      </div>
    </div>
  );
}
