export const LAB_TEST_TYPES = ["PCR"] as const;

export const PCR_TEST_PANELS = [
  "Respiratory",
  "Pneumonia",
  "Gastrointestinal (GI)",
  "Blood Culture",
  "Meningitis / Encephalitis",
  "STI",
  "Nail / Fungal",
  "UTI",
  "Wound / Tissue",
  "Women's Health",
  "Antimicrobial Resistance",
  "COVID/Flu/RSV",
] as const;

export const PCR_SAMPLE_TYPES = [
  "Nasopharyngeal Swab",
  "Oropharyngeal Swab",
  "Sputum",
  "Stool",
  "Urine",
  "Vaginal Swab",
  "Cervical Swab",
  "Whole Blood",
  "Plasma",
  "Serum",
  "Cerebrospinal Fluid (CSF)",
  "Tissue Biopsy",
  "Wound Swab",
  "Nail Clipping",
  "Skin Scrapings",
] as const;

export type LabTestType = (typeof LAB_TEST_TYPES)[number];
export type PcrTestPanel = (typeof PCR_TEST_PANELS)[number];
export type PcrSampleType = (typeof PCR_SAMPLE_TYPES)[number];

export const PATHOGEN_CATEGORIES = ["Virus", "Bacteria", "Fungus", "Parasite"] as const;

export type PathogenCategory = (typeof PATHOGEN_CATEGORIES)[number];

export interface PcrPathogenTarget {
  name: string;
  category: PathogenCategory;
  clinicalSignificance?: string | null;
}

export const ANTIBIOTIC_CLASSES = [
  "Beta-lactams",
  "Carbapenems",
  "Cephalosporins",
  "Fluoroquinolones",
  "Macrolides",
  "Penicillins",
  "Tetracyclines",
  "Sulfonamides",
  "Glycopeptides",
  "Polymyxins",
  "Aminoglycosides",
] as const;

export type AntibioticClass = (typeof ANTIBIOTIC_CLASSES)[number];

export interface PcrResistanceMarker {
  markerName: string;
  gene: string;
  antibioticClass: string;
  clinicalImplication?: string | null;
}
