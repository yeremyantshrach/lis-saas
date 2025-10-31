import { z } from "zod";
import { PATHOGEN_CATEGORIES, PCR_SAMPLE_TYPES, PCR_TEST_PANELS } from "@/lib/lab-tests/constants";

const pricePattern = /^\d+(\.\d{1,2})?$/;
const testCodePattern = /^PCR-\d{3}-\d{2}$/;
const loincPattern = /^\d{5}-\d$/;
const cptPattern = /^\d{5}$/;
const genePattern = /^[A-Za-z0-9]+$/;

const pathogenTargetSchema = z.object({
  name: z.string().trim().min(1, { message: "Pathogen name is required" }),
  category: z.enum(PATHOGEN_CATEGORIES),
  clinicalSignificance: z
    .string()
    .trim()
    .max(500, { message: "Clinical significance must be 500 characters or fewer" })
    .optional(),
});

const resistanceMarkerSchema = z.object({
  markerName: z
    .string()
    .trim()
    .regex(genePattern, { message: "Marker name must use letters or numbers only" }),
  gene: z.string().trim().regex(genePattern, { message: "Gene must use letters or numbers only" }),
  antibioticClass: z
    .string()
    .trim()
    .min(1, { message: "Select or enter an antibiotic class" })
    .transform((value) => value || ""),
  clinicalImplication: z
    .string()
    .trim()
    .max(500, { message: "Clinical implication must be 500 characters or fewer" })
    .optional(),
});

export const createPcrTestSchema = z.object({
  labId: z.uuid({ message: "Select a valid lab" }).optional(),
  testCode: z
    .string()
    .trim()
    .regex(testCodePattern, { message: "Test code must match PCR-000-00" })
    .optional(),
  testName: z.string().trim().min(1, { message: "Test name is required" }).max(100, {
    message: "Test name must be 100 characters or fewer",
  }),
  panel: z.enum(PCR_TEST_PANELS),
  sampleType: z.enum(PCR_SAMPLE_TYPES),
  price: z
    .string()
    .trim()
    .min(1, { message: "Enter a price" })
    .regex(pricePattern, { message: "Enter a valid price (e.g. 99 or 99.50)" }),
  pathogenTargets: z
    .array(pathogenTargetSchema)
    .min(1, { message: "Add at least one pathogen" })
    .superRefine((targets, ctx) => {
      const seen = new Set<string>();
      targets.forEach((target, index) => {
        const normalized = target.name.trim().toLowerCase();
        if (seen.has(normalized)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [index, "name"],
            message: "Duplicate pathogen name",
          });
        } else {
          seen.add(normalized);
        }
      });
    }),
  resistanceMarkers: z.array(resistanceMarkerSchema).optional(),
  loincCode: z
    .string()
    .trim()
    .regex(loincPattern, { message: "LOINC code must match 00000-0" })
    .optional(),
  cptCode: z.string().trim().regex(cptPattern, { message: "CPT code must be 5 digits" }).optional(),
  description: z.string().trim().max(500, { message: "Max 500 characters" }).optional(),
  defaultClinicalNotes: z.string().trim().optional(),
  orgSlug: z.string().optional(),
});

export type CreatePcrTestFormValues = z.input<typeof createPcrTestSchema>;
export type CreatePcrTestInput = z.infer<typeof createPcrTestSchema>;

export const updatePcrTestSchema = createPcrTestSchema.extend({
  id: z.string().uuid({ message: "Invalid test id" }),
});

export type UpdatePcrTestFormValues = z.input<typeof updatePcrTestSchema>;
export type UpdatePcrTestInput = z.infer<typeof updatePcrTestSchema>;

export const deletePcrTestSchema = z.object({
  id: z.uuid({ message: "Invalid test id" }),
  labId: z.uuid({ message: "Select a valid lab" }).optional(),
  orgSlug: z.string().optional(),
});

export type DeletePcrTestInput = z.infer<typeof deletePcrTestSchema>;
