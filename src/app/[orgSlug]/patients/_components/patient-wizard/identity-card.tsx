import { IconCalendar } from "@tabler/icons-react";
import { format } from "date-fns";
import { Controller, type UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PATIENT_GENDERS } from "@/lib/patients/constants";
import { cn } from "@/lib/utils";
import type { CreatePatientFormValues } from "@/lib/validations/patients";
import { FieldGroup } from "@/components/ui/field";
import { WizardField } from "./wizard-field";
import { DEFAULT_TEXT_INPUT_MAX_LENGTH } from "@/lib/constants/limits";

interface PatientIdentityCardProps {
  form: UseFormReturn<CreatePatientFormValues>;
  labs: { id: string; name: string }[];
}

export function PatientIdentityCard({ form, labs }: PatientIdentityCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity & Enrollment</CardTitle>
        <CardDescription>Legal demographics and emergency contacts.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <Controller
              control={form.control}
              name="labId"
              render={({ field, fieldState }) => (
                <WizardField
                  label="Owning Lab"
                  description="Determines which lab team owns this patient record."
                  error={fieldState.error}
                >
                  {({ inputId, labelId, describedBy, isInvalid }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <SelectTrigger
                        id={inputId}
                        aria-labelledby={labelId}
                        aria-describedby={describedBy}
                        aria-invalid={isInvalid}
                      >
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
                  )}
                </WizardField>
              )}
            />

            <div className="md:col-span-2 pt-2 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
              Legal identity
            </div>

            <Controller
              control={form.control}
              name="legalFirstName"
              render={({ field, fieldState }) => (
                <WizardField
                  label="Legal First Name"
                  description="Match what appears on government-issued identification."
                  error={fieldState.error}
                >
                  {({ inputId, describedBy, isInvalid }) => (
                    <Input
                      id={inputId}
                      placeholder="Jane"
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
              name="legalLastName"
              render={({ field, fieldState }) => (
                <WizardField
                  label="Legal Last Name"
                  description="Ensures eligibility checks and documents align."
                  error={fieldState.error}
                >
                  {({ inputId, describedBy, isInvalid }) => (
                    <Input
                      id={inputId}
                      placeholder="Patient"
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
              name="gender"
              render={({ field, fieldState }) => (
                <WizardField
                  label="Gender"
                  description="Used for requisitions and downstream lab integrations."
                  error={fieldState.error}
                >
                  {({ inputId, labelId, describedBy, isInvalid }) => (
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value as (typeof PATIENT_GENDERS)[number])
                      }
                      value={field.value ?? ""}
                    >
                      <SelectTrigger
                        id={inputId}
                        aria-labelledby={labelId}
                        aria-describedby={describedBy}
                        aria-invalid={isInvalid}
                      >
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {PATIENT_GENDERS.map((gender) => (
                          <SelectItem key={gender} value={gender} className="capitalize">
                            {gender}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </WizardField>
              )}
            />

            <Controller
              control={form.control}
              name="dateOfBirth"
              render={({ field, fieldState }) => {
                const value =
                  field.value instanceof Date
                    ? field.value
                    : field.value
                      ? new Date(field.value as string | number | Date)
                      : undefined;

                return (
                  <WizardField
                    label="Date of Birth"
                    description="We only allow realistic birthdates (1900 onward)."
                    error={fieldState.error}
                  >
                    {({ inputId, labelId, describedBy, isInvalid }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id={inputId}
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !value && "text-muted-foreground",
                            )}
                            aria-labelledby={labelId}
                            aria-describedby={describedBy}
                            aria-invalid={isInvalid}
                          >
                            {value ? format(value, "PPP") : "Select date"}
                            <IconCalendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={value}
                            onSelect={(date) => field.onChange(date ?? undefined)}
                            captionLayout="dropdown"
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </WizardField>
                );
              }}
            />

            <Controller
              control={form.control}
              name="primaryPhone"
              render={({ field, fieldState }) => (
                <WizardField
                  label="Primary Phone"
                  description="Primary number for scheduling updates and escalations."
                  error={fieldState.error}
                >
                  {({ inputId, describedBy, isInvalid }) => (
                    <Input
                      id={inputId}
                      type="tel"
                      placeholder="+1 (555) 123-4567"
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
              name="email"
              render={({ field, fieldState }) => (
                <WizardField
                  label="Email (optional)"
                  description="Send requisitions, invoices, or portal invites digitally."
                  error={fieldState.error}
                >
                  {({ inputId, describedBy, isInvalid }) => (
                    <Input
                      id={inputId}
                      type="email"
                      placeholder="patient@example.com"
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
              name="primaryMedicalOfficeName"
              render={({ field, fieldState }) => (
                <WizardField
                  className="md:col-span-2"
                  label="Primary Medical Office"
                  description="Reference which ordering provider requested the visit."
                  error={fieldState.error}
                >
                  {({ inputId, describedBy, isInvalid }) => (
                    <Input
                      id={inputId}
                      placeholder="Clinic or provider name"
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

            <div className="md:col-span-2 border-t pt-4 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
              Emergency contact
            </div>

            <Controller
              control={form.control}
              name="emergencyContactName"
              render={({ field, fieldState }) => (
                <WizardField
                  label="Emergency Contact Name"
                  description="Optional but recommended so teammates know who to call."
                  error={fieldState.error}
                >
                  {({ inputId, describedBy, isInvalid }) => (
                    <Input
                      id={inputId}
                      placeholder="Caregiver, spouse, etc."
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
              name="emergencyContactPhone"
              render={({ field, fieldState }) => (
                <WizardField
                  label="Emergency Contact Phone"
                  description="Only used if we cannot reach the patient directly."
                  error={fieldState.error}
                >
                  {({ inputId, describedBy, isInvalid }) => (
                    <Input
                      id={inputId}
                      type="tel"
                      placeholder="+1 (555) 987-6543"
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
              name="emergencyContactRelationship"
              render={({ field, fieldState }) => (
                <WizardField
                  label="Relationship"
                  description="Add context (parent, spouse, friend, etc.)."
                  error={fieldState.error}
                >
                  {({ inputId, describedBy, isInvalid }) => (
                    <Input
                      id={inputId}
                      placeholder="Parent, sibling, friend"
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
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
