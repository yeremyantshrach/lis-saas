import { IconCalendar, IconCheck, IconFilePlus } from "@tabler/icons-react";
import { format } from "date-fns";
import {
  type FieldArrayWithId,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
  type UseFormReturn,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import type { CreatePatientFormValues } from "@/lib/validations/patients";
import { cn } from "@/lib/utils";

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
        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
            <p className="text-sm font-medium text-foreground">No policies captured yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add at least the primary payer so prior authorizations can begin while the patient is
              on site.
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
                  <FormField
                    control={form.control}
                    name={`insurancePolicies.${index}.insuranceProvider`}
                    render={({ field: insuranceProviderField }) => (
                      <FormItem>
                        <FormLabel>Insurance Provider</FormLabel>
                        <FormDescription>
                          Payer name exactly as shown on the member card.
                        </FormDescription>
                        <FormControl>
                          <Input placeholder="Blue Cross Blue Shield" {...insuranceProviderField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`insurancePolicies.${index}.planName`}
                    render={({ field: planNameField }) => (
                      <FormItem>
                        <FormLabel>Plan Name</FormLabel>
                        <FormDescription>
                          Optional tier or metal level (PPO Silver, HSA, etc.).
                        </FormDescription>
                        <FormControl>
                          <Input placeholder="PPO Silver" {...planNameField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`insurancePolicies.${index}.policyNumber`}
                    render={({ field: policyNumberField }) => (
                      <FormItem>
                        <FormLabel>Policy Number</FormLabel>
                        <FormDescription>
                          Required for claim submission and eligibility checks.
                        </FormDescription>
                        <FormControl>
                          <Input placeholder="ABC12345" {...policyNumberField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`insurancePolicies.${index}.groupNumber`}
                    render={({ field: groupNumberField }) => (
                      <FormItem>
                        <FormLabel>Group Number</FormLabel>
                        <FormDescription>
                          Include if present—often needed for employer-sponsored plans.
                        </FormDescription>
                        <FormControl>
                          <Input placeholder="GRP-6789" {...groupNumberField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`insurancePolicies.${index}.subscriberId`}
                    render={({ field: subscriberIdField }) => (
                      <FormItem>
                        <FormLabel>Subscriber ID</FormLabel>
                        <FormDescription>
                          Member ID or subscriber number from the card.
                        </FormDescription>
                        <FormControl>
                          <Input placeholder="SUB-0001" {...subscriberIdField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`insurancePolicies.${index}.subscriberName`}
                    render={({ field: subscriberNameField }) => (
                      <FormItem>
                        <FormLabel>Subscriber Name</FormLabel>
                        <FormDescription>
                          Usually the policy holder or guarantor on file.
                        </FormDescription>
                        <FormControl>
                          <Input placeholder="Policy holder" {...subscriberNameField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`insurancePolicies.${index}.subscriberRelationship`}
                    render={({ field: subscriberRelationshipField }) => (
                      <FormItem>
                        <FormLabel>Subscriber Relationship</FormLabel>
                        <FormDescription>
                          Identify whether the patient is self, spouse, child, etc.
                        </FormDescription>
                        <FormControl>
                          <Input
                            placeholder="Self, spouse, parent"
                            {...subscriberRelationshipField}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`insurancePolicies.${index}.effectiveDate`}
                    render={({ field: effectiveDateField }) => {
                      const value =
                        effectiveDateField.value instanceof Date
                          ? effectiveDateField.value
                          : effectiveDateField.value
                            ? new Date(effectiveDateField.value as string | number | Date)
                            : undefined;

                      return (
                        <FormItem className="flex flex-col">
                          <FormLabel>Effective Date</FormLabel>
                          <FormDescription>
                            Optional, but helps verify current coverage.
                          </FormDescription>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !value && "text-muted-foreground",
                                  )}
                                >
                                  {value ? format(value, "PPP") : "Select date"}
                                  <IconCalendar className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={value}
                                onSelect={(date) => effectiveDateField.onChange(date ?? undefined)}
                                captionLayout="dropdown-months"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name={`insurancePolicies.${index}.copayAmount`}
                    render={({ field: copayField }) => (
                      <FormItem>
                        <FormLabel>Copay Amount</FormLabel>
                        <FormDescription>
                          Optional quick reference for front-desk teams.
                        </FormDescription>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="20.00"
                            {...copayField}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`insurancePolicies.${index}.deductibleBalance`}
                    render={({ field: deductibleField }) => (
                      <FormItem>
                        <FormLabel>Deductible Balance</FormLabel>
                        <FormDescription>
                          Helps billing estimate out-of-pocket costs.
                        </FormDescription>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="250.00"
                            {...deductibleField}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`insurancePolicies.${index}.medicareEligible`}
                    render={({ field: medicareField }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel className="text-base">Medicare Eligible</FormLabel>
                          <FormDescription>
                            Toggle on if the patient has active Medicare.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={medicareField.value}
                            onCheckedChange={medicareField.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`insurancePolicies.${index}.medicaidEligible`}
                    render={({ field: medicaidField }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel className="text-base">Medicaid Eligible</FormLabel>
                          <FormDescription>Track active Medicaid coverage.</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={medicaidField.value}
                            onCheckedChange={medicaidField.onChange}
                          />
                        </FormControl>
                      </FormItem>
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
      </CardContent>
    </Card>
  );
}
