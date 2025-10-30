import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Table as TanstackTable } from "@tanstack/react-table";
import { IconMicroscope } from "@tabler/icons-react";
import { flexRender } from "@tanstack/react-table";
import type { PcrTestTableRow } from "./types";

interface PcrTestsTableSectionProps {
  table: TanstackTable<PcrTestTableRow>;
  columnCount: number;
  tableDataLength: number;
  filteredRowCount: number;
  start: number;
  end: number;
  canCreate: boolean;
  labsCount: number;
}

export function PcrTestsTableSection({
  table,
  columnCount,
  tableDataLength,
  filteredRowCount,
  start,
  end,
  canCreate,
  labsCount,
}: PcrTestsTableSectionProps) {
  if (tableDataLength === 0) {
    return (
      <Empty className="mt-6">
        <EmptyMedia variant="icon">
          <IconMicroscope className="h-6 w-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No PCR tests yet</EmptyTitle>
          <EmptyDescription>
            Start capturing your assay catalog so orders and billing stay consistent.{" "}
            {canCreate
              ? labsCount > 0
                ? "Use the button above to add your first test."
                : "Add your first lab to begin creating tests."
              : ""}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <p className="text-sm text-muted-foreground">
            Document panel, sample type, and reference notes up front—no more scrambling during
            accessioning.
          </p>
        </EmptyContent>
      </Empty>
    );
  }

  const rows = table.getRowModel().rows;

  return (
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
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>No tests match your filters</EmptyTitle>
                      <EmptyDescription>
                        Try adjusting your filters or clearing the search to see everything again.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
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
          {filteredRowCount !== tableDataLength ? ` (filtered from ${tableDataLength})` : ""}
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
  );
}
