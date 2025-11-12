export const PATIENT_GENDERS = ["male", "female", "other"] as const;

export const PATIENT_PROFILE_STATUSES = ["active", "inactive", "archived"] as const;

export const PATIENT_DOCUMENT_TYPES = ["government_id", "insurance_card", "other"] as const;

export const PATIENT_DOCUMENT_STATUSES = ["pending", "uploaded", "failed", "archived"] as const;

export const PATIENT_PAYMENT_METHODS = [
  "insurance",
  "self_pay",
  "payment_plan",
  "credit_card",
  "cash",
  "check",
] as const;

export const PATIENT_RELATIONSHIP_OPTIONS = [
  "parent",
  "spouse",
  "sibling",
  "guardian",
  "friend",
  "other",
] as const;

export type PatientGender = (typeof PATIENT_GENDERS)[number];
export type PatientProfileStatus = (typeof PATIENT_PROFILE_STATUSES)[number];
export type PatientDocumentType = (typeof PATIENT_DOCUMENT_TYPES)[number];
export type PatientDocumentStatus = (typeof PATIENT_DOCUMENT_STATUSES)[number];
export type PatientPaymentMethod = (typeof PATIENT_PAYMENT_METHODS)[number];
export type PatientRelationshipOption = (typeof PATIENT_RELATIONSHIP_OPTIONS)[number];
