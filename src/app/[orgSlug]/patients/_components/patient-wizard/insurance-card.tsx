import { IconCalendar, IconCheck, IconFilePlus } from "@tabler/icons-react";
import { format } from "date-fns";
import {
  Controller,
  type FieldArrayWithId,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
  type UseFormReturn,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import type { CreatePatientFormValues } from "@/lib/validations/patients";
import { cn } from "@/lib/utils";
import { FieldGroup } from "@/components/ui/field";
import { WizardField } from "./wizard-field";
import { DEFAULT_TEXT_INPUT_MAX_LENGTH } from "@/lib/constants/limits";

interface PatientInsuranceCardProps {
  form: UseFormReturn<CreatePatientFormValues>;
  fields: FieldArrayWithId<CreatePatientFormValues, "insurancePolicies", "id">[];
  appendPolicy: UseFieldArrayAppend<CreatePatientFormValues, "insurancePolicies">;
  removePolicy: UseFieldArrayRemove;
  isSubmitting: boolean;
}

export function PatientInsuranceCard({
  form,
  fields,
  appendPolicy,
  removePolicy,
  isSubmitting,
}: PatientInsuranceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Insurance Coverage</CardTitle>
        <CardDescription>
          Capture what&apos;s on the card so eligibility checks, prior auth, and billing queues can
          run without manual follow-up.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FieldGroup className="space-y-4">
          {fields.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
              <p className="text-sm font-medium text-foreground">No policies captured yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add at least the primary payer so prior authorizations can begin while the patient
                is on site.
              </p>
              <div className="mt-4 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                <div className="flex items-start gap-2 text-left">
                  <IconCheck className="mt-0.5 h-3.5 w-3.5 text-primary" />
                  <span>Include provider + policy number exactly as they appear on the card.</span>
                </div>
                <div className="flex items-start gap-2 text-left">
                  <IconCheck className="mt-0.5 h-3.5 w-3.5 text-primary" />
                  <span>Mark Medicare/Medicaid eligibility so billing can route correctly.</span>
                </div>
              </div>
              <Button
                type="button"
                className="mt-4"
                variant="outline"
                onClick={() =>
                  appendPolicy({
                    insuranceProvider: "",
                    planName: "",
                    policyNumber: "",
                    groupNumber: "",
                    subscriberId: "",
                    subscriberName: "",
                    subscriberRelationship: "",
                    copayAmount: "",
                    deductibleBalance: "",
                    medicareEligible: false,
                    medicaidEligible: false,
                  })
                }
              >
                <IconFilePlus className="mr-2 h-4 w-4" /> Add policy
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Policy {index + 1}</p>
                      <p className="text-xs text-muted-foreground">
                        Provider, subscriber, and eligibility details.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePolicy(index)}
                      disabled={fields.length === 1 && isSubmitting}
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Controller
                      control={form.control}
                      name={`insurancePolicies.${index}.insuranceProvider`}
                      render={({ field: insuranceProviderField, fieldState }) => (
                        <WizardField
                          label="Insurance Provider"
                          description="Payer name exactly as shown on the member card."
                          error={fieldState.error}
                        >
                          {({ inputId, describedBy, isInvalid }) => (
                            <Input
                              id={inputId}
                              placeholder="Blue Cross Blue Shield"
                              {...insuranceProviderField}
                              value={insuranceProviderField.value ?? ""}
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
                      name={`insurancePolicies.${index}.planName`}
                      render={({ field: planNameField, fieldState }) => (
                        <WizardField
                          label="Plan Name"
                          description="Optional tier or metal level (PPO Silver, HSA, etc.)."
                          error={fieldState.error}
                        >
                          {({ inputId, describedBy, isInvalid }) => (
                            <Input
                              id={inputId}
                              placeholder="PPO Silver"
                              {...planNameField}
                              value={planNameField.value ?? ""}
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
                      name={`insurancePolicies.${index}.policyNumber`}
                      render={({ field: policyNumberField, fieldState }) => (
                        <WizardField
                          label="Policy Number"
                          description="Required for claim submission and eligibility checks."
                          error={fieldState.error}
                        >
                          {({ inputId, describedBy, isInvalid }) => (
                            <Input
                              id={inputId}
                              placeholder="ABC12345"
                              {...policyNumberField}
                              value={policyNumberField.value ?? ""}
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
                      name={`insurancePolicies.${index}.groupNumber`}
                      render={({ field: groupNumberField, fieldState }) => (
                        <WizardField
                          label="Group Number"
                          description="Include if present—often needed for employer-sponsored plans."
                          error={fieldState.error}
                        >
                          {({ inputId, describedBy, isInvalid }) => (
                            <Input
                              id={inputId}
                              placeholder="GRP-6789"
                              {...groupNumberField}
                              value={groupNumberField.value ?? ""}
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
                      name={`insurancePolicies.${index}.subscriberId`}
                      render={({ field: subscriberIdField, fieldState }) => (
                        <WizardField
                          label="Subscriber ID"
                          description="Member ID or subscriber number from the card."
                          error={fieldState.error}
                        >
                          {({ inputId, describedBy, isInvalid }) => (
                            <Input
                              id={inputId}
                              placeholder="SUB-0001"
                              {...subscriberIdField}
                              value={subscriberIdField.value ?? ""}
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
                      name={`insurancePolicies.${index}.subscriberName`}
                      render={({ field: subscriberNameField, fieldState }) => (
                        <WizardField
                          label="Subscriber Name"
                          description="Usually the policy holder or guarantor on file."
                          error={fieldState.error}
                        >
                          {({ inputId, describedBy, isInvalid }) => (
                            <Input
                              id={inputId}
                              placeholder="Policy holder"
                              {...subscriberNameField}
                              value={subscriberNameField.value ?? ""}
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
                      name={`insurancePolicies.${index}.subscriberRelationship`}
                      render={({ field: subscriberRelationshipField, fieldState }) => (
                        <WizardField
                          label="Subscriber Relationship"
                          description="Identify whether the patient is self, spouse, child, etc."
                          error={fieldState.error}
                        >
                          {({ inputId, describedBy, isInvalid }) => (
                            <Input
                              id={inputId}
                              placeholder="Self, spouse, parent"
                              {...subscriberRelationshipField}
                              value={subscriberRelationshipField.value ?? ""}
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
                      name={`insurancePolicies.${index}.effectiveDate`}
                      render={({ field: effectiveDateField, fieldState }) => {
                        const value =
                          effectiveDateField.value instanceof Date
                            ? effectiveDateField.value
                            : effectiveDateField.value
                              ? new Date(effectiveDateField.value as string | number | Date)
                              : undefined;

                        return (
                          <WizardField
                            label="Effective Date"
                            description="Optional, but helps verify current coverage."
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
                                    onSelect={(date) =>
                                      effectiveDateField.onChange(date ?? undefined)
                                    }
                                    captionLayout="dropdown-months"
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
                      name={`insurancePolicies.${index}.copayAmount`}
                      render={({ field: copayField, fieldState }) => (
                        <WizardField
                          label="Copay Amount"
                          description="Optional quick reference for front-desk teams."
                          error={fieldState.error}
                        >
                          {({ inputId, describedBy, isInvalid }) => (
                            <Input
                              id={inputId}
                              type="number"
                              inputMode="decimal"
                              placeholder="20.00"
                              {...copayField}
                              value={copayField.value ?? ""}
                              aria-describedby={describedBy}
                              aria-invalid={isInvalid}
                            />
                          )}
                        </WizardField>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name={`insurancePolicies.${index}.deductibleBalance`}
                      render={({ field: deductibleField, fieldState }) => (
                        <WizardField
                          label="Deductible Balance"
                          description="Helps billing estimate out-of-pocket costs."
                          error={fieldState.error}
                        >
                          {({ inputId, describedBy, isInvalid }) => (
                            <Input
                              id={inputId}
                              type="number"
                              inputMode="decimal"
                              placeholder="250.00"
                              {...deductibleField}
                              value={deductibleField.value ?? ""}
                              aria-describedby={describedBy}
                              aria-invalid={isInvalid}
                            />
                          )}
                        </WizardField>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name={`insurancePolicies.${index}.medicareEligible`}
                      render={({ field: medicareField, fieldState }) => (
                        <WizardField
                          className="rounded-lg border p-3"
                          orientation="responsive"
                          label={
                            <div className="text-base">
                              Medicare Eligible
                              <p className="text-xs text-muted-foreground font-normal">
                                Toggle on if the patient has active Medicare.
                              </p>
                            </div>
                          }
                          error={fieldState.error}
                        >
                          {({ inputId, labelId, describedBy }) => (
                            <Switch
                              id={inputId}
                              checked={medicareField.value}
                              onCheckedChange={medicareField.onChange}
                              aria-labelledby={labelId}
                              aria-describedby={describedBy}
                            />
                          )}
                        </WizardField>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name={`insurancePolicies.${index}.medicaidEligible`}
                      render={({ field: medicaidField, fieldState }) => (
                        <WizardField
                          className="rounded-lg border p-3"
                          orientation="responsive"
                          label={
                            <div className="text-base">
                              Medicaid Eligible
                              <p className="text-xs text-muted-foreground font-normal">
                                Track active Medicaid coverage.
                              </p>
                            </div>
                          }
                          error={fieldState.error}
                        >
                          {({ inputId, labelId, describedBy }) => (
                            <Switch
                              id={inputId}
                              checked={medicaidField.value}
                              onCheckedChange={medicaidField.onChange}
                              aria-labelledby={labelId}
                              aria-describedby={describedBy}
                            />
                          )}
                        </WizardField>
                      )}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  appendPolicy({
                    insuranceProvider: "",
                    planName: "",
                    policyNumber: "",
                    groupNumber: "",
                    subscriberId: "",
                    subscriberName: "",
                    subscriberRelationship: "",
                    copayAmount: "",
                    deductibleBalance: "",
                    medicareEligible: false,
                    medicaidEligible: false,
                  })
                }
                disabled={isSubmitting}
              >
                <IconFilePlus className="mr-2 h-4 w-4" />
                Add another policy
              </Button>
            </div>
          )}
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
