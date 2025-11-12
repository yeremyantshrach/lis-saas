import { differenceInYears, format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CreatePatientFormValues } from "@/lib/validations/patients";

interface PatientSnapshotCardProps {
  values: Partial<CreatePatientFormValues>;
  labs: { id: string; name: string }[];
}

export function PatientSnapshotCard({ values, labs }: PatientSnapshotCardProps) {
  const labName = labs.find((lab) => lab.id === values.labId)?.name ?? "Select a lab";
  const birthDate =
    values.dateOfBirth instanceof Date
      ? values.dateOfBirth
      : values.dateOfBirth
        ? new Date(values.dateOfBirth as string | number | Date)
        : null;
  const age = birthDate ? differenceInYears(new Date(), birthDate) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Snapshot</CardTitle>
        <CardDescription>Live preview of what you are about to save.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold capitalize">
              {values.legalFirstName || "First"} {values.legalLastName || "Last"}
            </p>
            <p className="text-xs text-muted-foreground">{labName}</p>
          </div>
          {age !== null && <Badge>{age} yrs</Badge>}
        </div>

        <dl className="grid gap-2">
          <div>
            <dt className="text-xs text-muted-foreground">DOB</dt>
            <dd>{birthDate ? format(birthDate, "PPP") : "Not set"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Contact</dt>
            <dd>
              {values.primaryPhone || "Phone missing"}
              {values.email && <span className="text-muted-foreground"> • {values.email}</span>}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Address</dt>
            <dd>
              {values.contact?.streetAddress ? (
                <>
                  {values.contact.streetAddress}
                  {values.contact.addressLine2 ? `, ${values.contact.addressLine2}` : ""}{" "}
                  {values.contact.city && `${values.contact.city}, `}
                  {values.contact.state}
                  {values.contact.postalCode ? ` ${values.contact.postalCode}` : ""}
                </>
              ) : (
                "Missing address"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Billing</dt>
            <dd>
              {values.billing?.preferredPaymentMethod
                ? formatPaymentMethodLabel(values.billing.preferredPaymentMethod)
                : "Payment method pending"}
              {values.billing?.paperlessBillingEnabled ? " • Paperless" : ""}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

function formatPaymentMethodLabel(value?: string | null) {
  if (!value) return "";
  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}
