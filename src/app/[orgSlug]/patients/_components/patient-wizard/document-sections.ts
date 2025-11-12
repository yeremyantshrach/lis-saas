import { IconId, IconShieldCheck } from "@tabler/icons-react";

import type { PATIENT_DOCUMENT_TYPES } from "@/lib/patients/constants";

export const DOCUMENT_SECTIONS = [
  {
    type: "government_id" as (typeof PATIENT_DOCUMENT_TYPES)[number],
    title: "Government ID",
    description: "Driver's license or passport, encrypted at rest.",
    icon: IconId,
  },
  {
    type: "insurance_card" as (typeof PATIENT_DOCUMENT_TYPES)[number],
    title: "Insurance Card",
    description: "Front and back of the active plan.",
    icon: IconShieldCheck,
  },
] as const;

export type DocumentSectionType = (typeof DOCUMENT_SECTIONS)[number]["type"];
