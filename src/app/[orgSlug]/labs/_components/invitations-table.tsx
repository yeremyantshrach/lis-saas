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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cancelInvitationAction } from "@/lib/actions/cancel-invitation-action";
import { formatRoleLabel } from "@/lib/utils";
import { IconMail } from "@tabler/icons-react";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface InvitationsTableProps {
  invitations: {
    id: string;
    email: string;
    role: string | null;
    status: string;
    expiresAt: string | Date;
    createdAt?: string | Date | null;
    lab?: {
      id: string;
      name: string | null;
    } | null;
  }[];
}

export function InvitationsTable({ invitations }: InvitationsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [invitationList, setInvitationList] = useState(invitations);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    setInvitationList(invitations);
  }, [invitations]);

  const normalizedInvitations = useMemo(
    () =>
      invitationList.map((invitation) => ({
        ...invitation,
        expiresAt: new Date(invitation.expiresAt),
        createdAt: invitation.createdAt ? new Date(invitation.createdAt) : undefined,
      })),
    [invitationList],
  );

  const filteredInvitations = useMemo(() => {
    const lowered = searchQuery.trim().toLowerCase();
    if (!lowered) return normalizedInvitations;
    return normalizedInvitations.filter((invitation) =>
      invitation.email.toLowerCase().includes(lowered),
    );
  }, [normalizedInvitations, searchQuery]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchQuery, invitations]);

  useEffect(() => {
    const maxPageIndex = Math.max(
      0,
      Math.ceil(filteredInvitations.length / pagination.pageSize) - 1,
    );
    if (pagination.pageIndex > maxPageIndex) {
      setPagination((prev) => ({ ...prev, pageIndex: maxPageIndex }));
    }
  }, [filteredInvitations.length, pagination.pageIndex, pagination.pageSize]);

  const columns: ColumnDef<(typeof filteredInvitations)[number]>[] = [
    {
      id: "email",
      header: "Email",
      cell: ({ row }) => (
        <Button
          asChild
          variant="link"
          className="h-auto p-0 text-sm font-medium text-primary"
          aria-label={`Compose email to ${row.original.email}`}
        >
          <a href={`mailto:${row.original.email}`} className="inline-flex items-center gap-1">
            <IconMail className="h-3.5 w-3.5" />
            {row.original.email}
          </a>
        </Button>
      ),
    },
    {
      id: "lab",
      header: "Lab",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.lab?.name ?? "—"}</span>
      ),
    },
    {
      id: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.role ? formatRoleLabel(row.original.role) : "Pending"}
        </Badge>
      ),
    },
    {
      id: "created",
      header: "Invited",
      cell: ({ row }) =>
        row.original.createdAt ? (
          <span className="text-sm text-muted-foreground">
            {dateFormatter.format(row.original.createdAt)}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      id: "expires",
      header: "Expires",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">
          {dateFormatter.format(row.original.expiresAt)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              setErrorMessage(null);
              setCancelId(row.original.id);
            }}
          >
            Cancel
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredInvitations,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const totalInvitations = filteredInvitations.length;
  const hasInvitations = totalInvitations > 0;
  const from = hasInvitations ? pagination.pageIndex * pagination.pageSize + 1 : 0;
  const to = hasInvitations
    ? Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalInvitations)
    : 0;
  const pageCount = table.getPageCount() || 1;

  const handleCancel = () => {
    if (!cancelId) return;
    startTransition(async () => {
      const result = await cancelInvitationAction(cancelId);
      if (!result.success) {
        setErrorMessage(result.error ?? "Failed to cancel invitation.");
        return;
      }

      setInvitationList((prev) => prev.filter((inv) => inv.id !== cancelId));
      setErrorMessage(null);
      setCancelId(null);
    });
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setCancelId(null);
      setErrorMessage(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search invitations by email"
          className="w-full sm:max-w-xs"
          aria-label="Search invitations"
        />
        <span className="text-sm text-muted-foreground">
          Showing {from}-{to} of {totalInvitations} invitations
        </span>
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
                  No invitations found. Send a new invitation to see it listed here.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

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

      <AlertDialog open={cancelId !== null} onOpenChange={handleDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel invitation</AlertDialogTitle>
            <AlertDialogDescription>
              This invitation will be revoked immediately. The recipient will no longer be able to
              join using it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Keep Invitation</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleCancel} disabled={isPending}>
              {isPending ? "Cancelling..." : "Cancel Invitation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
