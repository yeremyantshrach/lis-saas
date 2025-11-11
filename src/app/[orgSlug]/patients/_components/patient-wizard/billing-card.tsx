import type { UseFormReturn } from "react-hook-form";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="billing.preferredPaymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Payment Method</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Insurance, self-pay, etc." />
                    </SelectTrigger>
                  </FormControl>
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="billing.billingEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Billing Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="billing@patient.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="billing.paperlessBillingEnabled"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <FormLabel className="text-base">Enable Paperless Billing</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Disable mailed statements when enabled.
                  </p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="billing.patientIsGuarantor"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <FormLabel className="text-base">Patient is Guarantor</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Uncheck if a different person is financially responsible.
                  </p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
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
