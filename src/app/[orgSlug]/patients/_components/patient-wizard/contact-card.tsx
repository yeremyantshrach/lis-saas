import type { UseFormReturn } from "react-hook-form";

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
import type { CreatePatientFormValues } from "@/lib/validations/patients";

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
      <CardContent className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="contact.streetAddress"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Street Address</FormLabel>
              <FormDescription>
                Use the location where kits and statements should arrive.
              </FormDescription>
              <FormControl>
                <Input placeholder="123 Main St, Suite 200" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact.addressLine2"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Address Line 2 (optional)</FormLabel>
              <FormDescription>Suite, floor, building, or PO box details.</FormDescription>
              <FormControl>
                <Input placeholder="Floor, unit, or PO box" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact.city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormDescription>We use this to pre-fill requisition paperwork.</FormDescription>
              <FormControl>
                <Input placeholder="Atlanta" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact.state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State / Region</FormLabel>
              <FormDescription>Needed for courier routing and compliance.</FormDescription>
              <FormControl>
                <Input placeholder="GA" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact.postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postal / ZIP Code</FormLabel>
              <FormDescription>Verifies whether courier pickups are available.</FormDescription>
              <FormControl>
                <Input placeholder="30301" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
