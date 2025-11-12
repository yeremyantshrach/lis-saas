import { IconCalendar } from "@tabler/icons-react";
import { format } from "date-fns";
import type { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
      <CardContent className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="labId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Owning Lab</FormLabel>
              <FormDescription>Determines which lab team owns this patient record.</FormDescription>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a lab" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {labs.map((lab) => (
                    <SelectItem key={lab.id} value={lab.id}>
                      {lab.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="md:col-span-2 pt-2 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
          Legal identity
        </div>

        <FormField
          control={form.control}
          name="legalFirstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Legal First Name</FormLabel>
              <FormDescription>
                Match what appears on government-issued identification.
              </FormDescription>
              <FormControl>
                <Input placeholder="Jane" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="legalLastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Legal Last Name</FormLabel>
              <FormDescription>Ensures eligibility checks and documents align.</FormDescription>
              <FormControl>
                <Input placeholder="Patient" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <FormDescription>
                Used for requisitions and downstream lab integrations.
              </FormDescription>
              <Select
                onValueChange={(value) => field.onChange(value as (typeof PATIENT_GENDERS)[number])}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PATIENT_GENDERS.map((gender) => (
                    <SelectItem key={gender} value={gender} className="capitalize">
                      {gender}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => {
            const value =
              field.value instanceof Date
                ? field.value
                : field.value
                  ? new Date(field.value as string | number | Date)
                  : undefined;

            return (
              <FormItem className="flex flex-col">
                <FormLabel>Date of Birth</FormLabel>
                <FormDescription>We only allow realistic birthdates (1900 onward).</FormDescription>
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
                      onSelect={(date) => field.onChange(date ?? undefined)}
                      captionLayout="dropdown"
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
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
          name="primaryPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Phone</FormLabel>
              <FormDescription>
                Primary number for scheduling updates and escalations.
              </FormDescription>
              <FormControl>
                <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (optional)</FormLabel>
              <FormDescription>
                Send requisitions, invoices, or portal invites digitally.
              </FormDescription>
              <FormControl>
                <Input type="email" placeholder="patient@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primaryMedicalOfficeName"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Primary Medical Office</FormLabel>
              <FormDescription>
                Reference which ordering provider requested the visit.
              </FormDescription>
              <FormControl>
                <Input placeholder="Clinic or provider name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="md:col-span-2 border-t pt-4 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
          Emergency contact
        </div>

        <FormField
          control={form.control}
          name="emergencyContactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emergency Contact Name</FormLabel>
              <FormDescription>
                Optional but recommended so teammates know who to call.
              </FormDescription>
              <FormControl>
                <Input placeholder="Caregiver, spouse, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emergencyContactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emergency Contact Phone</FormLabel>
              <FormDescription>Only used if we cannot reach the patient directly.</FormDescription>
              <FormControl>
                <Input type="tel" placeholder="+1 (555) 987-6543" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emergencyContactRelationship"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relationship</FormLabel>
              <FormDescription>Add context (parent, spouse, friend, etc.).</FormDescription>
              <FormControl>
                <Input placeholder="Parent, sibling, friend" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
