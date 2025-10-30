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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
import { IconEdit, IconMail, IconTrash } from "@tabler/icons-react";
import { formatRoleLabel, getInitials } from "@/lib/utils";
import { EditMemberForm } from "@/components/forms/edit-member-form";
import { removeMemberAction } from "@/lib/actions/member-actions";
import { type Lab } from "@/lib/auth-client";

const joinedFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export interface OrganizationMemberWithUser {
  id: string;
  role: string;
  userId?: string;
  team?: {
    id: string;
    name: string;
  } | null;
  createdAt?: string | Date | null;
  user: {
    id?: string;
    name?: string | null;
    email: string;
  };
}

interface TeamMembersTableProps {
  members: OrganizationMemberWithUser[];
  userId?: string;
  labs?: Lab[];
  userRole?: string;
}

export function TeamMembersTable({ members, userId, labs = [], userRole }: TeamMembersTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<OrganizationMemberWithUser | null>(null);
  const [deletingMember, setDeletingMember] = useState<OrganizationMemberWithUser | null>(null);
  const [isPending, startTransition] = useTransition();

  // Permission checks based on user role
  const canEditRole = userRole === "org-owner" || userRole === "lab-admin";
  const canChangeTeam = userRole === "org-owner";

  const normalizedMembers = useMemo(
    () =>
      members.map((member) => ({
        ...member,
        createdAt: member.createdAt ? new Date(member.createdAt) : undefined,
      })),
    [members],
  );

  const availableRoles = useMemo(() => {
    const unique = new Set<string>();
    normalizedMembers.forEach((member) => unique.add(member.role));
    return Array.from(unique).map((role) => ({
      value: role,
      label: formatRoleLabel(role),
    }));
  }, [normalizedMembers]);

  const filteredMembers = useMemo(() => {
    const lowered = searchQuery.trim().toLowerCase();
    return normalizedMembers.filter((member) => {
      if (roleFilter !== "all" && member.role !== roleFilter) {
        return false;
      }

      if (!lowered) return true;

      const name = member.user.name ?? "";
      const email = member.user.email ?? "";
      return name.toLowerCase().includes(lowered) || email.toLowerCase().includes(lowered);
    });
  }, [normalizedMembers, roleFilter, searchQuery]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchQuery, roleFilter, members]);

  useEffect(() => {
    const maxPageIndex = Math.max(0, Math.ceil(filteredMembers.length / pagination.pageSize) - 1);
    if (pagination.pageIndex > maxPageIndex) {
      setPagination((prev) => ({ ...prev, pageIndex: maxPageIndex }));
    }
  }, [filteredMembers.length, pagination.pageIndex, pagination.pageSize]);

  const columns: ColumnDef<(typeof filteredMembers)[number]>[] = [
    {
      id: "member",
      header: "Member",
      cell: ({ row }) => {
        const member = row.original;
        const displayName = member.user.name || member.user.email;
        const initials = getInitials(displayName);
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
              {initials.slice(0, 2)}
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{displayName}</span>
              <span className="text-xs text-muted-foreground">{member.user.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      id: "team",
      header: "Team",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.team?.name ?? "—"}</span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role;
        const label = formatRoleLabel(role);
        const isCurrentUser = row.original.userId === userId;
        return (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{label}</Badge>
            {isCurrentUser && <Badge variant="default">You</Badge>}
          </div>
        );
      },
    },
    {
      id: "email",
      header: "Email",
      cell: ({ row }) => (
        <Button
          asChild
          variant="link"
          className="h-auto p-0 text-sm font-normal text-primary"
          aria-label={`Email ${row.original.user.name || row.original.user.email}`}
        >
          <a href={`mailto:${row.original.user.email}`} className="inline-flex items-center gap-1">
            <IconMail className="h-3.5 w-3.5" />
            {row.original.user.email}
          </a>
        </Button>
      ),
    },
    {
      id: "joined",
      header: "Joined",
      cell: ({ row }) => {
        const createdAt = row.original.createdAt;
        if (!createdAt) return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <span className="text-sm text-muted-foreground">{joinedFormatter.format(createdAt)}</span>
        );
      },
    },
  ];

  // Add actions column if user has permission to edit members
  if (canEditRole) {
    columns.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const member = row.original;
        const isCurrentUser = member.userId === userId;
        const isOrgOwner = member.role === "org-owner";
        return isOrgOwner ? null : (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Edit ${member.user.name || member.user.email}`}
              onClick={() => {
                setEditingMember(member);
                setEditDrawerOpen(true);
              }}
              disabled={isCurrentUser}
            >
              <IconEdit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              aria-label={`Remove ${member.user.name || member.user.email}`}
              onClick={() => {
                setDeletingMember(member);
                setDeleteDialogOpen(true);
              }}
              disabled={isCurrentUser}
            >
              <IconTrash className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    });
  }

  const table = useReactTable({
    data: filteredMembers,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const totalMembers = filteredMembers.length;
  const hasMembers = totalMembers > 0;
  const from = hasMembers ? pagination.pageIndex * pagination.pageSize + 1 : 0;
  const to = hasMembers
    ? Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalMembers)
    : 0;
  const pageCount = table.getPageCount() || 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name or email"
            className="w-full sm:max-w-xs"
            aria-label="Search team members"
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {availableRoles.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-muted-foreground">
          Showing {from}-{to} of {totalMembers} members
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
                  No members match your filters.
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

      {/* Edit Member Drawer */}
      <Drawer open={editDrawerOpen} direction="right" onOpenChange={setEditDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Member</DrawerTitle>
            <DrawerDescription>Update member permissions and team assignment.</DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            {editingMember && (
              <EditMemberForm
                memberId={editingMember.id}
                currentRole={editingMember.role}
                currentTeamId={editingMember.team?.id}
                memberName={editingMember.user.name}
                memberEmail={editingMember.user.email}
                labs={labs}
                canChangeRole={canEditRole}
                canChangeTeam={canChangeTeam}
                onSuccess={() => {
                  setEditDrawerOpen(false);
                  setEditingMember(null);
                }}
                onCancel={() => {
                  setEditDrawerOpen(false);
                  setEditingMember(null);
                }}
              />
            )}
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Member Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold">
                {deletingMember?.user.name || deletingMember?.user.email}
              </span>{" "}
              from the team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!deletingMember) return;
                startTransition(async () => {
                  await removeMemberAction({ memberId: deletingMember.id });
                  setDeleteDialogOpen(false);
                  setDeletingMember(null);
                });
              }}
              disabled={isPending}
            >
              {isPending ? "Removing..." : "Remove Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
