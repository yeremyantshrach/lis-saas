import { Controller, type UseFormReturn } from "react-hook-form";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DEFAULT_TEXT_INPUT_MAX_LENGTH } from "@/lib/constants/limits";
import type { CreatePatientFormValues } from "@/lib/validations/patients";
import { WizardField } from "./wizard-field";

interface PatientContactCardProps {
  form: UseFormReturn<CreatePatientFormValues>;
}

export function PatientContactCard({ form }: PatientContactCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact & Address</CardTitle>
        <CardDescription>
          Provide the patient&apos;s preferred mailing location so kits, requisitions, and invoices
          go to the right place the first time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          <Controller
            control={form.control}
            name="contact.streetAddress"
            render={({ field, fieldState }) => (
              <WizardField
                className="md:col-span-2"
                label="Street Address"
                description="Use the location where kits and statements should arrive."
                error={fieldState.error}
              >
                {({ inputId, describedBy, isInvalid }) => (
                  <Input
                    id={inputId}
                    placeholder="123 Main St, Suite 200"
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

          <Controller
            control={form.control}
            name="contact.addressLine2"
            render={({ field, fieldState }) => (
              <WizardField
                className="md:col-span-2"
                label="Address Line 2 (optional)"
                description="Suite, floor, building, or PO box details."
                error={fieldState.error}
              >
                {({ inputId, describedBy, isInvalid }) => (
                  <Input
                    id={inputId}
                    placeholder="Floor, unit, or PO box"
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

          <Controller
            control={form.control}
            name="contact.city"
            render={({ field, fieldState }) => (
              <WizardField
                label="City"
                description="We use this to pre-fill requisition paperwork."
                error={fieldState.error}
              >
                {({ inputId, describedBy, isInvalid }) => (
                  <Input
                    id={inputId}
                    placeholder="Atlanta"
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

          <Controller
            control={form.control}
            name="contact.state"
            render={({ field, fieldState }) => (
              <WizardField
                label="State / Region"
                description="Needed for courier routing and compliance."
                error={fieldState.error}
              >
                {({ inputId, describedBy, isInvalid }) => (
                  <Input
                    id={inputId}
                    placeholder="GA"
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

          <Controller
            control={form.control}
            name="contact.postalCode"
            render={({ field, fieldState }) => (
              <WizardField
                label="Postal / ZIP Code"
                description="Verifies whether courier pickups are available."
                error={fieldState.error}
              >
                {({ inputId, describedBy, isInvalid }) => (
                  <Input
                    id={inputId}
                    placeholder="30301"
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
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
