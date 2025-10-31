import { relations } from "drizzle-orm";
import { labTestPcrDetails, labTests } from "./schema";
import { labs } from "@/lib/auth/auth-schema";

export const labTestsRelations = relations(labTests, ({ one }) => ({
  lab: one(labs, {
    fields: [labTests.labId],
    references: [labs.id],
  }),
  pcrDetails: one(labTestPcrDetails, {
    fields: [labTests.id],
    references: [labTestPcrDetails.labTestId],
  }),
}));

export const labTestPcrDetailsRelations = relations(labTestPcrDetails, ({ one }) => ({
  labTest: one(labTests, {
    fields: [labTestPcrDetails.labTestId],
    references: [labTests.id],
  }),
}));
