import { Controller, type UseFormReturn } from "react-hook-form";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PATIENT_PAYMENT_METHODS } from "@/lib/patients/constants";
import type { CreatePatientFormValues } from "@/lib/validations/patients";
import { DEFAULT_TEXT_INPUT_MAX_LENGTH } from "@/lib/constants/limits";
import { WizardField } from "./wizard-field";

interface PatientBillingCardProps {
  form: UseFormReturn<CreatePatientFormValues>;
}

export function PatientBillingCard({ form }: PatientBillingCardProps) {
  const selectedPaymentMethod = form.watch("billing.preferredPaymentMethod") as string | undefined;
  const hasLegacyPaymentMethod =
    typeof selectedPaymentMethod === "string" &&
    selectedPaymentMethod.length > 0 &&
    !PATIENT_PAYMENT_METHODS.includes(
      selectedPaymentMethod as (typeof PATIENT_PAYMENT_METHODS)[number],
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Preferences</CardTitle>
        <CardDescription>Configure payment method and statement delivery.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <Controller
              control={form.control}
              name="billing.preferredPaymentMethod"
              render={({ field, fieldState }) => (
                <WizardField
                  label="Preferred Payment Method"
                  error={fieldState.error}
                  description="Insurance, self-pay, etc."
                >
                  {({ inputId, labelId, describedBy, isInvalid }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <SelectTrigger
                        id={inputId}
                        aria-labelledby={labelId}
                        aria-describedby={describedBy}
                        aria-invalid={isInvalid}
                      >
                        <SelectValue placeholder="Insurance, self-pay, etc." />
                      </SelectTrigger>
                      <SelectContent>
                        {PATIENT_PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>
                            {formatPaymentMethodLabel(method)}
                          </SelectItem>
                        ))}
                        {hasLegacyPaymentMethod && selectedPaymentMethod && (
                          <SelectItem value={selectedPaymentMethod}>
                            {formatPaymentMethodLabel(selectedPaymentMethod)}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </WizardField>
              )}
            />

            <Controller
              control={form.control}
              name="billing.billingEmail"
              render={({ field, fieldState }) => (
                <WizardField label="Billing Email" error={fieldState.error}>
                  {({ inputId, describedBy, isInvalid }) => (
                    <Input
                      id={inputId}
                      type="email"
                      placeholder="billing@patient.com"
                      {...field}
                      value={field.value ?? ""}
                      maxLength={DEFAULT_TEXT_INPUT_MAX_LENGTH}
                      aria-describedby={describedBy}
                      aria-invalid={isInvalid}
                    />
                  )}
                </WizardField>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Controller
              control={form.control}
              name="billing.paperlessBillingEnabled"
              render={({ field, fieldState }) => (
                <WizardField
                  className="rounded-lg border p-3"
                  orientation="responsive"
                  label={
                    <div className="text-base">
                      Enable Paperless Billing
                      <p className="text-xs text-muted-foreground font-normal">
                        Disable mailed statements when enabled.
                      </p>
                    </div>
                  }
                  error={fieldState.error}
                >
                  {({ inputId, labelId, describedBy }) => (
                    <Switch
                      id={inputId}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                    />
                  )}
                </WizardField>
              )}
            />

            <Controller
              control={form.control}
              name="billing.patientIsGuarantor"
              render={({ field, fieldState }) => (
                <WizardField
                  className="rounded-lg border p-3"
                  orientation="responsive"
                  label={
                    <div className="text-base">
                      Patient is Guarantor
                      <p className="text-xs text-muted-foreground font-normal">
                        Uncheck if a different person is financially responsible.
                      </p>
                    </div>
                  }
                  error={fieldState.error}
                >
                  {({ inputId, labelId, describedBy }) => (
                    <Switch
                      id={inputId}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                    />
                  )}
                </WizardField>
              )}
            />
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function formatPaymentMethodLabel(value: string) {
  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}
