"use client";

import { Badge } from "@/components/ui/badge";
import type { PatientProfileStatus } from "@/lib/patients/constants";

const STATUS_COPY: Record<
  PatientProfileStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" | "success" }
> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "secondary" },
  archived: { label: "Archived", variant: "outline" },
};

interface PatientStatusBadgeProps {
  status: PatientProfileStatus;
  className?: string;
}

export function PatientStatusBadge({ status, className }: PatientStatusBadgeProps) {
  const config = STATUS_COPY[status] ?? STATUS_COPY.active;
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
