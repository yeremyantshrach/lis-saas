import { z } from "zod";
import {
  PATIENT_GENDERS,
  PATIENT_PAYMENT_METHODS,
  PATIENT_PROFILE_STATUSES,
} from "@/lib/patients/constants";

const phonePattern = /^[0-9+().\-\s]{10,20}$/;
const postalCodePattern = /^[A-Za-z0-9\s\\-]{3,12}$/;
const currencyPattern = /^\d+(\.\d{1,2})?$/;

const optionalString = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

const emailSchema = z
  .string()
  .trim()
  .email({ message: "Enter a valid email address" })
  .optional()
  .or(z.literal("").transform(() => undefined));

const phoneSchema = z
  .string()
  .trim()
  .regex(phonePattern, { message: "Enter a valid phone number" });

export const patientIdentitySchema = z.object({
  labId: z.string().uuid().optional(),
  orgSlug: z.string().optional(),
  legalFirstName: z
    .string()
    .trim()
    .min(1, { message: "First name is required" })
    .max(80, { message: "First name must be 80 characters or fewer" }),
  legalLastName: z
    .string()
    .trim()
    .min(1, { message: "Last name is required" })
    .max(80, { message: "Last name must be 80 characters or fewer" }),
  dateOfBirth: z.coerce.date({ message: "Select a valid date of birth" }),
  gender: z.enum(PATIENT_GENDERS),
  primaryPhone: phoneSchema,
  email: emailSchema,
  primaryMedicalOfficeId: z.string().uuid().optional(),
  primaryMedicalOfficeName: optionalString,
  emergencyContactName: optionalString,
  emergencyContactPhone: z
    .string()
    .trim()
    .regex(phonePattern, { message: "Enter a valid phone number" })
    .optional()
    .or(z.literal("").transform(() => undefined)),
  emergencyContactRelationship: optionalString,
});

export const patientContactSchema = z.object({
  streetAddress: z
    .string()
    .trim()
    .min(1, { message: "Street address is required" })
    .max(200, { message: "Street address must be 200 characters or fewer" }),
  addressLine2: optionalString,
  city: z
    .string()
    .trim()
    .min(1, { message: "City is required" })
    .max(100, { message: "City must be 100 characters or fewer" }),
  state: z
    .string()
    .trim()
    .min(2, { message: "State/Region is required" })
    .max(100, { message: "State/Region must be 100 characters or fewer" }),
  postalCode: z
    .string()
    .trim()
    .regex(postalCodePattern, { message: "Enter a valid postal/ZIP code" }),
});

export const patientBillingSchema = z.object({
  preferredPaymentMethod: z.enum(PATIENT_PAYMENT_METHODS).optional(),
  billingEmail: emailSchema,
  paperlessBillingEnabled: z.boolean().default(false),
  patientIsGuarantor: z.boolean().default(true),
});

export const patientInsurancePolicySchema = z.object({
  id: z.string().uuid().optional(),
  insuranceProvider: z
    .string()
    .trim()
    .min(1, { message: "Insurance provider is required" })
    .max(120, { message: "Insurance provider must be 120 characters or fewer" }),
  planName: optionalString,
  policyNumber: optionalString,
  groupNumber: optionalString,
  subscriberId: optionalString,
  subscriberName: optionalString,
  subscriberRelationship: optionalString,
  effectiveDate: z.coerce.date().optional(),
  copayAmount: z
    .string()
    .trim()
    .regex(currencyPattern, { message: "Enter a valid copay amount" })
    .optional(),
  deductibleBalance: z
    .string()
    .trim()
    .regex(currencyPattern, { message: "Enter a valid deductible amount" })
    .optional(),
  medicareEligible: z.boolean().default(false),
  medicaidEligible: z.boolean().default(false),
});

export const createPatientSchema = patientIdentitySchema.extend({
  contact: patientContactSchema.optional(),
  billing: patientBillingSchema.optional(),
  insurancePolicies: z.array(patientInsurancePolicySchema).optional(),
  notes: optionalString,
});

export const upsertPatientSchema = createPatientSchema.extend({
  patientId: z.uuid().optional(),
  previousLabId: z.uuid().optional(),
});

export const updatePatientPersonalSchema = patientIdentitySchema.extend({
  patientId: z.uuid({ message: "Invalid patient id" }),
});

export const updatePatientContactSchema = z.object({
  patientId: z.uuid(),
  contact: patientContactSchema,
  orgSlug: z.string().optional(),
});

export const updatePatientBillingSchema = z.object({
  patientId: z.uuid(),
  billing: patientBillingSchema,
  orgSlug: z.string().optional(),
});

export const replacePatientInsuranceSchema = z.object({
  patientId: z.uuid(),
  policies: z.array(patientInsurancePolicySchema),
  orgSlug: z.string().optional(),
});

export const linkPatientToLabSchema = z.object({
  patientId: z.string().uuid(),
  labId: z.string().uuid().optional(),
  orgSlug: z.string().optional(),
  notes: optionalString,
});

export const archivePatientSchema = z.object({
  patientId: z.uuid(),
  labId: z.uuid().optional(),
  status: z.enum(PATIENT_PROFILE_STATUSES).default("archived"),
  orgSlug: z.string().optional(),
});

export const deletePatientDocumentSchema = z.object({
  documentId: z.string().uuid(),
  patientId: z.string().uuid(),
  orgSlug: z.string().optional(),
});

export const matchPatientIdentitySchema = z.object({
  legalFirstName: patientIdentitySchema.shape.legalFirstName,
  legalLastName: patientIdentitySchema.shape.legalLastName,
  dateOfBirth: patientIdentitySchema.shape.dateOfBirth,
  primaryPhone: patientIdentitySchema.shape.primaryPhone,
  email: patientIdentitySchema.shape.email,
  orgSlug: z.string().optional(),
});

export type CreatePatientFormValues = z.input<typeof createPatientSchema>;
export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export type UpdatePatientPersonalInput = z.input<typeof updatePatientPersonalSchema>;
export type UpdatePatientContactInput = z.input<typeof updatePatientContactSchema>;
export type UpdatePatientBillingInput = z.input<typeof updatePatientBillingSchema>;
export type ReplacePatientInsuranceInput = z.input<typeof replacePatientInsuranceSchema>;
export type LinkPatientToLabInput = z.infer<typeof linkPatientToLabSchema>;
export type ArchivePatientInput = z.infer<typeof archivePatientSchema>;
export type DeletePatientDocumentInput = z.infer<typeof deletePatientDocumentSchema>;
export type MatchPatientIdentityInput = z.infer<typeof matchPatientIdentitySchema>;
export type UpsertPatientInput = z.input<typeof upsertPatientSchema>;
