import type { PcrLabTestRecord } from "@/lib/helpers/lab-tests-helpers";

export type PcrTestTableRow = {
  id: string;
  labId: string;
  testName: string;
  testCode: string;
  labName: string;
  panel: string;
  sampleType: string;
  price: number;
  priceDisplay: string;
  pathogenTargets: PcrLabTestRecord["pathogenTargets"];
  resistanceMarkers: PcrLabTestRecord["resistanceMarkers"];
  loincCode: string | null;
  cptCode: string | null;
  defaultClinicalNotes: string | null;
  searchText: string;
};
