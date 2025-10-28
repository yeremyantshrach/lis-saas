"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ColumnDef,
  PaginationState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { type Lab } from "@/lib/auth-client";
import { deleteLabAction } from "@/lib/actions/delete-lab-action";
import { PermissionGuard } from "@/components/permission-guard";
import { CreateLabForm } from "@/components/forms/create-lab-form";
import { EditLabForm } from "@/components/forms/edit-lab-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";

interface LabsTableProps {
  labs: Lab[];
  canManageLabs: boolean;
}

export function LabsTable({ labs, canManageLabs }: LabsTableProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [deletingLab, setDeletingLab] = useState<Lab | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const filteredLabs = useMemo(() => {
    if (!searchQuery.trim()) return labs;
    const lowered = searchQuery.toLowerCase();
    return labs.filter((lab) => lab.name.toLowerCase().includes(lowered));
  }, [labs, searchQuery]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchQuery, labs]);

  useEffect(() => {
    const maxPageIndex = Math.max(0, Math.ceil(filteredLabs.length / pagination.pageSize) - 1);
    if (pagination.pageIndex > maxPageIndex) {
      setPagination((prev) => ({ ...prev, pageIndex: maxPageIndex }));
    }
  }, [filteredLabs.length, pagination.pageIndex, pagination.pageSize]);

  const columns: ColumnDef<Lab>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
  ];

  if (canManageLabs) {
    columns.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Rename ${row.original.name}`}
            onClick={() => {
              setEditingLab(row.original);
              setEditModalOpen(true);
            }}
          >
            <IconEdit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            aria-label={`Delete ${row.original.name}`}
            onClick={() => {
              setDeletingLab(row.original);
              setDeleteModalOpen(true);
            }}
          >
            <IconTrash className="h-4 w-4" />
          </Button>
        </div>
      ),
    });
  }

  const table = useReactTable({
    data: filteredLabs,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const totalLabs = labs.length;
  const filteredCount = filteredLabs.length;
  const hasLabs = totalLabs > 0;
  const from = filteredCount ? pagination.pageIndex * pagination.pageSize + 1 : 0;
  const to = filteredCount
    ? Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredCount)
    : 0;
  const pageCount = table.getPageCount() || 1;
  const resultsLabel = filteredCount
    ? filteredCount === totalLabs
      ? `Showing ${from}-${to} of ${totalLabs} labs`
      : `Showing ${from}-${to} of ${filteredCount} matches`
    : `No matches found in ${totalLabs} labs`;

  const handleDelete = () => {
    if (!canManageLabs) return;
    if (!deletingLab) return;
    startTransition(async () => {
      await deleteLabAction(deletingLab.id, deletingLab.organizationId);
      setDeleteModalOpen(false);
      setDeletingLab(null);
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Labs</CardTitle>
            <CardDescription>
              {canManageLabs
                ? "Centralize your lab management with quick search and inline actions."
                : "Review the labs you have access to."}
            </CardDescription>
          </div>
          <PermissionGuard permission="team:create">
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <IconPlus className="mr-2 h-4 w-4" />
                  Create Lab
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Lab</DialogTitle>
                </DialogHeader>
                <CreateLabForm onClose={() => setCreateModalOpen(false)} />
              </DialogContent>
            </Dialog>
          </PermissionGuard>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasLabs ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search labs by name..."
                  className="w-full sm:max-w-xs"
                  aria-label="Search labs"
                />
                <span className="text-sm text-muted-foreground">{resultsLabel}</span>
              </div>

              <div className="rounded-md border">
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
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center text-sm text-muted-foreground"
                        >
                          No labs match your search. Try a different keyword.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {pageCount === 0 ? 0 : pagination.pageIndex + 1} of {pageCount}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page</span>
                    <Select
                      value={String(pagination.pageSize)}
                      onValueChange={(value) => table.setPageSize(Number(value))}
                    >
                      <SelectTrigger className="h-9 w-[90px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[5, 10, 20, 50].map((size) => (
                          <SelectItem key={size} value={String(size)}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
            </>
          ) : (
            <div className="rounded-md border border-dashed p-10 text-center">
              <div className="mx-auto max-w-md space-y-3">
                <h3 className="text-lg font-medium">No labs yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create your first lab to start organizing members and tracking workstreams.
                </p>
                <PermissionGuard permission="team:create">
                  <Button size="sm" onClick={() => setCreateModalOpen(true)}>
                    <IconPlus className="mr-2 h-4 w-4" />
                    Create Lab
                  </Button>
                </PermissionGuard>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {canManageLabs && (
        <>
          <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Lab</DialogTitle>
              </DialogHeader>
              {editingLab && (
                <EditLabForm
                  lab={editingLab}
                  onSuccess={() => {
                    setEditModalOpen(false);
                    setEditingLab(null);
                  }}
                />
              )}
            </DialogContent>
          </Dialog>

          <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Lab</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{deletingLab?.name}&quot;? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isPending}>
                  {isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
}
