import { relations } from "drizzle-orm";
import {
  labPatientProfiles,
  patientBillingProfiles,
  patientContactDetails,
  patientDocuments,
  patientInsurancePolicies,
  patientRegistry,
  patients,
} from "@/lib/patients/schema";
import { labs } from "@/lib/auth/auth-schema";

export const patientsRelations = relations(patients, ({ one, many }) => ({
  registry: one(patientRegistry, {
    fields: [patients.id],
    references: [patientRegistry.id],
  }),
  contactDetails: one(patientContactDetails, {
    fields: [patients.id],
    references: [patientContactDetails.patientId],
  }),
  billingProfile: one(patientBillingProfiles, {
    fields: [patients.id],
    references: [patientBillingProfiles.patientId],
  }),
  insurancePolicies: many(patientInsurancePolicies),
  documents: many(patientDocuments),
  labProfiles: many(labPatientProfiles),
}));

export const patientContactRelations = relations(patientContactDetails, ({ one }) => ({
  patient: one(patients, {
    fields: [patientContactDetails.patientId],
    references: [patients.id],
  }),
}));

export const patientBillingRelations = relations(patientBillingProfiles, ({ one }) => ({
  patient: one(patients, {
    fields: [patientBillingProfiles.patientId],
    references: [patients.id],
  }),
}));

export const patientInsuranceRelations = relations(patientInsurancePolicies, ({ one }) => ({
  patient: one(patients, {
    fields: [patientInsurancePolicies.patientId],
    references: [patients.id],
  }),
}));

export const patientDocumentRelations = relations(patientDocuments, ({ one }) => ({
  patient: one(patients, {
    fields: [patientDocuments.patientId],
    references: [patients.id],
  }),
}));

export const labPatientProfileRelations = relations(labPatientProfiles, ({ one }) => ({
  patient: one(patients, {
    fields: [labPatientProfiles.patientId],
    references: [patients.id],
  }),
  lab: one(labs, {
    fields: [labPatientProfiles.labId],
    references: [labs.id],
  }),
}));
