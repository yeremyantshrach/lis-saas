import { sql, asc, eq } from "drizzle-orm";
import { db } from "@/lib/database";
import { labTests, labTestPcrDetails } from "@/lib/lab-tests/schema";
import {
  LAB_TEST_TYPES,
  PCR_TEST_PANELS,
  PCR_SAMPLE_TYPES,
  type LabTestType,
  type PcrPathogenTarget,
  type PcrResistanceMarker,
  type PcrTestPanel,
  type PcrSampleType,
} from "@/lib/lab-tests/constants";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface LabTestRlsContext {
  userId: string;
  organizationId: string | null;
  labId: string | null;
}

export interface CreatePcrTestInput {
  labId: string;
  testCode?: string | null;
  testName: string;
  panel: PcrTestPanel;
  sampleType: PcrSampleType;
  price: string;
  pathogenTargets: PcrPathogenTarget[];
  resistanceMarkers: PcrResistanceMarker[];
  loincCode?: string | null;
  cptCode?: string | null;
  description?: string | null;
  defaultClinicalNotes?: string | null;
}

export interface PcrLabTestRecord {
  id: string;
  labId: string;
  type: LabTestType;
  testCode: string;
  testName: string;
  panel: PcrTestPanel;
  sampleType: PcrSampleType;
  price: string;
  pathogenTargets: PcrPathogenTarget[];
  resistanceMarkers: PcrResistanceMarker[];
  loincCode: string | null;
  cptCode: string | null;
  description: string | null;
  defaultClinicalNotes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

async function applyLabTestRlsContext(tx: Transaction, context: LabTestRlsContext) {
  const { userId, organizationId, labId } = context;

  await tx.execute(sql`select set_config('lis.current_user_id', ${userId ?? ""}, true) as ignored`);
  await tx.execute(
    sql`select set_config('lis.active_organization_id', ${organizationId ?? ""}, true) as ignored`,
  );
  await tx.execute(sql`select set_config('lis.active_lab_id', ${labId ?? ""}, true) as ignored`);
}

export async function listAccessiblePcrTests(context: LabTestRlsContext) {
  return db.transaction(async (tx) => {
    await applyLabTestRlsContext(tx, context);

    const rows = await tx
      .select({
        id: labTests.id,
        labId: labTests.labId,
        type: labTests.type,
        testCode: labTests.testCode,
        testName: labTests.testName,
        price: labTests.price,
        loincCode: labTests.loincCode,
        cptCode: labTests.cptCode,
        description: labTests.description,
        defaultClinicalNotes: labTests.defaultClinicalNotes,
        createdAt: labTests.createdAt,
        updatedAt: labTests.updatedAt,
        panel: labTestPcrDetails.panel,
        sampleType: labTestPcrDetails.sampleType,
        pathogenTargets: labTestPcrDetails.pathogenTargets,
        resistanceMarkers: labTestPcrDetails.resistanceMarkers,
      })
      .from(labTests)
      .innerJoin(labTestPcrDetails, eq(labTestPcrDetails.labTestId, labTests.id))
      .where(eq(labTests.type, LAB_TEST_TYPES[0]))
      .orderBy(asc(labTests.testName));

    return rows as PcrLabTestRecord[];
  });
}

async function ensureLabDetailColumnsAreJson(tx: Transaction) {
  try {
    await tx.execute(sql`
      alter table "lab_test_pcr_details"
        alter column "pathogen_targets" type jsonb using to_jsonb("pathogen_targets"),
        alter column "resistance_markers" type jsonb using to_jsonb("resistance_markers");
    `);
  } catch (error) {
    const pgError = error as { code?: string };
    // Ignore when the columns already have the desired type or don't exist yet.
    if (pgError?.code && !["42804", "42703"].includes(pgError.code)) {
      throw error;
    }
  }
}

function generateTestCode(): string {
  const randomThreeDigits = Math.floor(100 + Math.random() * 900);
  const randomTwoDigits = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0");
  return `PCR-${randomThreeDigits}-${randomTwoDigits}`;
}

async function ensureUniqueTestCode(tx: Transaction, testCode: string): Promise<boolean> {
  const existing = await tx
    .select({ id: labTests.id })
    .from(labTests)
    .where(eq(labTests.testCode, testCode))
    .limit(1);

  return existing.length === 0;
}

export async function createPcrLabTest(
  context: LabTestRlsContext,
  input: CreatePcrTestInput,
): Promise<{ id: string }> {
  if (!PCR_TEST_PANELS.includes(input.panel)) {
    throw new Error("Unsupported PCR panel selection");
  }

  if (!PCR_SAMPLE_TYPES.includes(input.sampleType)) {
    throw new Error("Unsupported sample type selection");
  }

  const normalizedPathogens: PcrPathogenTarget[] = (input.pathogenTargets ?? []).map(
    (pathogen) => ({
      name: pathogen.name.trim(),
      category: pathogen.category,
      clinicalSignificance: pathogen.clinicalSignificance
        ? pathogen.clinicalSignificance.trim()
        : undefined,
    }),
  );

  const normalizedMarkers: PcrResistanceMarker[] = (input.resistanceMarkers ?? []).map(
    (marker) => ({
      markerName: marker.markerName.trim(),
      gene: marker.gene.trim(),
      antibioticClass: marker.antibioticClass.trim(),
      clinicalImplication: marker.clinicalImplication
        ? marker.clinicalImplication.trim()
        : undefined,
    }),
  );

  return db.transaction(async (tx) => {
    await applyLabTestRlsContext(tx, context);

    const resolvedCode = await (async () => {
      if (input.testCode) {
        if (!(await ensureUniqueTestCode(tx, input.testCode))) {
          throw new Error("Test code already in use. Provide a unique code or leave blank.");
        }
        return input.testCode;
      }

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const candidate = generateTestCode();
        if (await ensureUniqueTestCode(tx, candidate)) {
          return candidate;
        }
      }
      throw new Error("Unable to generate a unique test code. Please try again.");
    })();

    const [labTest] = await tx
      .insert(labTests)
      .values({
        labId: input.labId,
        type: LAB_TEST_TYPES[0],
        testCode: resolvedCode,
        testName: input.testName,
        price: input.price,
        loincCode: input.loincCode ?? null,
        cptCode: input.cptCode ?? null,
        description: input.description ?? null,
        defaultClinicalNotes: input.defaultClinicalNotes ?? null,
      })
      .returning({
        id: labTests.id,
      });

    if (!labTest) {
      throw new Error("Failed to create lab test");
    }

    const attemptInsert = async () => {
      await tx.insert(labTestPcrDetails).values({
        labTestId: labTest.id,
        panel: input.panel,
        sampleType: input.sampleType,
        pathogenTargets: normalizedPathogens,
        resistanceMarkers: normalizedMarkers,
      });
    };

    try {
      await attemptInsert();
    } catch (error) {
      const pgError = error as { code?: string };
      if (pgError?.code === "22P02" || pgError?.code === "42804") {
        await ensureLabDetailColumnsAreJson(tx);
        await attemptInsert();
      } else {
        throw error;
      }
    }

    return { id: labTest.id };
  });
}
