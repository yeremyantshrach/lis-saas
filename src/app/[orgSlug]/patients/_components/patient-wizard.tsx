"use client";

import { IconCheck, IconInfoCircle } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  createPatientSchema,
  matchPatientIdentitySchema,
  type CreatePatientFormValues,
  type UpsertPatientInput,
} from "@/lib/validations/patients";
import {
  deletePatientDocumentAction,
  matchPatientProfileAction,
  uploadPatientDocumentAction,
  upsertPatientProfileAction,
} from "@/lib/actions/patient-actions";
import type {
  PatientDocumentRecord,
  PatientMatchSummary,
  PatientProfileRecord,
} from "@/lib/helpers/patient-helpers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { PatientBillingCard } from "./patient-wizard/billing-card";
import { PatientContactCard } from "./patient-wizard/contact-card";
import { PatientDocumentsCard } from "./patient-wizard/documents-card";
import { DOCUMENT_SECTIONS, type DocumentSectionType } from "./patient-wizard/document-sections";
import { PatientIdentityCard } from "./patient-wizard/identity-card";
import { PatientInsuranceCard } from "./patient-wizard/insurance-card";
import { PatientSnapshotCard } from "./patient-wizard/snapshot-card";

const OVERVIEW_CALLOUTS = [
  {
    title: "Identity & Contact",
    body: "Legal names, DOB, phone, and emergency contacts stay aligned for every lab.",
  },
  {
    title: "Coverage & Billing",
    body: "Capture insurance eligibility and billing preferences up front to reduce rework.",
  },
  {
    title: "Documents",
    body: "Store IDs and insurance cards now or defer with a placeholder for follow up.",
  },
] as const;

const DOCUMENT_SECTION_TYPE_SET = new Set<DocumentSectionType>(
  DOCUMENT_SECTIONS.map((section) => section.type),
);

function createDocumentFileState(): Record<DocumentSectionType, File[]> {
  const initial = {} as Record<DocumentSectionType, File[]>;
  for (const section of DOCUMENT_SECTIONS) {
    initial[section.type] = [];
  }
  return initial;
}

function createDeferredUploadState(
  documents?: PatientDocumentRecord[] | null,
): Record<DocumentSectionType, boolean> {
  const initial = {} as Record<DocumentSectionType, boolean>;
  for (const section of DOCUMENT_SECTIONS) {
    const hasPending =
      documents?.some(
        (document) => document.documentType === section.type && document.status === "pending",
      ) ?? false;
    initial[section.type] = hasPending;
  }
  return initial;
}

interface PatientWizardProps {
  labs: { id: string; name: string }[];
  defaultLabId?: string | null;
  orgSlug: string;
  existingPatient?: PatientProfileRecord;
  mode?: "create" | "edit";
  canDeleteDocuments?: boolean;
}

export function PatientWizard({
  labs,
  defaultLabId,
  orgSlug,
  existingPatient,
  mode = "create",
  canDeleteDocuments = false,
}: PatientWizardProps) {
  const router = useRouter();
  const formId = useId();
  const [matches, setMatches] = useState<PatientMatchSummary[]>([]);
  const matchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isMatching, startMatching] = useTransition();

  const [documentFiles, setDocumentFiles] =
    useState<Record<DocumentSectionType, File[]>>(createDocumentFileState);

  const [deferredUploads, setDeferredUploads] = useState<Record<DocumentSectionType, boolean>>(() =>
    createDeferredUploadState(existingPatient?.documents ?? null),
  );
  const [serverDocuments, setServerDocuments] = useState<PatientDocumentRecord[]>(
    () => existingPatient?.documents?.filter((document) => document.status !== "archived") ?? [],
  );
  const [documentPendingRemoval, setDocumentPendingRemoval] =
    useState<PatientDocumentRecord | null>(null);
  const [documentRemovingId, setDocumentRemovingId] = useState<string | null>(null);
  const [documentReplacementCandidate, setDocumentReplacementCandidate] = useState<{
    type: DocumentSectionType;
    files: File[];
  } | null>(null);

  const isEditMode = mode === "edit" || Boolean(existingPatient);

  const deriveDefaultValues = (): CreatePatientFormValues => {
    if (!existingPatient) {
      const defaults: Partial<CreatePatientFormValues> = {
        labId: defaultLabId ?? labs[0]?.id ?? "",
        gender: undefined,
        legalFirstName: "",
        legalLastName: "",
        primaryPhone: "",
        email: "",
        primaryMedicalOfficeName: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelationship: "",
        dateOfBirth: undefined,
        contact: {
          streetAddress: "",
          addressLine2: "",
          city: "",
          state: "",
          postalCode: "",
        },
        billing: {
          preferredPaymentMethod: undefined,
          billingEmail: "",
          paperlessBillingEnabled: true,
          patientIsGuarantor: true,
        },
        insurancePolicies: [],
        notes: "",
      };
      return defaults as CreatePatientFormValues;
    }

    const primaryLabId = existingPatient.labProfiles[0]?.labId ?? defaultLabId ?? labs[0]?.id ?? "";

    const defaults: Partial<CreatePatientFormValues> = {
      labId: primaryLabId,
      gender: existingPatient.gender,
      legalFirstName: existingPatient.legalFirstName,
      legalLastName: existingPatient.legalLastName,
      primaryPhone: existingPatient.primaryPhone,
      email: existingPatient.email ?? "",
      primaryMedicalOfficeName: existingPatient.primaryMedicalOfficeName ?? "",
      primaryMedicalOfficeId: existingPatient.primaryMedicalOfficeId ?? undefined,
      emergencyContactName: existingPatient.emergencyContactName ?? "",
      emergencyContactPhone: existingPatient.emergencyContactPhone ?? "",
      emergencyContactRelationship: existingPatient.emergencyContactRelationship ?? "",
      dateOfBirth: existingPatient.dateOfBirth,
      contact: existingPatient.contact
        ? {
            streetAddress: existingPatient.contact.streetAddress,
            addressLine2: existingPatient.contact.addressLine2 ?? "",
            city: existingPatient.contact.city,
            state: existingPatient.contact.state,
            postalCode: existingPatient.contact.postalCode,
          }
        : {
            streetAddress: "",
            addressLine2: "",
            city: "",
            state: "",
            postalCode: "",
          },
      billing: existingPatient.billing
        ? {
            preferredPaymentMethod: existingPatient.billing.preferredPaymentMethod ?? undefined,
            billingEmail: existingPatient.billing.billingEmail ?? "",
            paperlessBillingEnabled: existingPatient.billing.paperlessBillingEnabled,
            patientIsGuarantor: existingPatient.billing.patientIsGuarantor,
          }
        : {
            preferredPaymentMethod: undefined,
            billingEmail: "",
            paperlessBillingEnabled: true,
            patientIsGuarantor: true,
          },
      insurancePolicies:
        existingPatient.insurancePolicies?.map((policy) => ({
          id: policy.id,
          insuranceProvider: policy.insuranceProvider,
          planName: policy.planName ?? "",
          policyNumber: policy.policyNumber ?? "",
          groupNumber: policy.groupNumber ?? "",
          subscriberId: policy.subscriberId ?? "",
          subscriberName: policy.subscriberName ?? "",
          subscriberRelationship: policy.subscriberRelationship ?? "",
          effectiveDate: policy.effectiveDate ?? undefined,
          copayAmount: policy.copayAmount ?? "",
          deductibleBalance: policy.deductibleBalance ?? "",
          medicareEligible: policy.medicareEligible,
          medicaidEligible: policy.medicaidEligible,
        })) ?? [],
      notes: existingPatient.labProfiles[0]?.notes ?? "",
    };

    return defaults as CreatePatientFormValues;
  };

  const form = useForm<CreatePatientFormValues>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: deriveDefaultValues(),
    mode: "onBlur",
  });

  const {
    fields: insurancePolicyFields,
    append: appendInsurancePolicy,
    remove: removeInsurancePolicy,
  } = useFieldArray({
    control: form.control,
    name: "insurancePolicies",
  });

  const snapshotValues =
    (useWatch({ control: form.control }) as CreatePatientFormValues) ?? form.getValues();

  useEffect(() => {
    if (existingPatient) {
      form.reset(deriveDefaultValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingPatient?.id]);

  useEffect(() => {
    const nextDocuments =
      existingPatient?.documents?.filter((document) => document.status !== "archived") ?? [];
    setServerDocuments(nextDocuments);
    setDeferredUploads(createDeferredUploadState(nextDocuments));
  }, [existingPatient?.documents]);

  useEffect(() => {
    if (isEditMode) return;
    const subscription = form.watch((values) => {
      const readyForMatch =
        Boolean(values.legalFirstName?.trim()) &&
        Boolean(values.legalLastName?.trim()) &&
        Boolean(values.primaryPhone?.trim()) &&
        Boolean(values.dateOfBirth);

      if (!readyForMatch) {
        setMatches([]);
        if (matchTimeoutRef.current) {
          clearTimeout(matchTimeoutRef.current);
          matchTimeoutRef.current = null;
        }
        return;
      }

      if (matchTimeoutRef.current) {
        clearTimeout(matchTimeoutRef.current);
      }

      matchTimeoutRef.current = setTimeout(() => {
        startMatching(async () => {
          const payload = {
            legalFirstName: values.legalFirstName,
            legalLastName: values.legalLastName,
            dateOfBirth: values.dateOfBirth,
            primaryPhone: values.primaryPhone,
            email: values.email,
            orgSlug,
          };

          const parsed = matchPatientIdentitySchema.safeParse(payload);
          if (!parsed.success) return;

          const result = await matchPatientProfileAction(parsed.data);
          if (result.success && result.data) {
            setMatches(result.data.matches);
          }
        });
      }, 600);
    });

    return () => {
      subscription.unsubscribe();
      if (matchTimeoutRef.current) {
        clearTimeout(matchTimeoutRef.current);
      }
    };
  }, [form, orgSlug, startMatching, isEditMode]);

  const documentsByType = useMemo(() => {
    const grouped = {} as Record<DocumentSectionType, PatientDocumentRecord[]>;
    for (const section of DOCUMENT_SECTIONS) {
      grouped[section.type] = [];
    }

    for (const document of serverDocuments) {
      if (!DOCUMENT_SECTION_TYPE_SET.has(document.documentType as DocumentSectionType)) {
        continue;
      }

      const sectionType = document.documentType as DocumentSectionType;
      if (document.status === "archived") continue;
      grouped[sectionType].push(document);
    }

    for (const section of DOCUMENT_SECTIONS) {
      grouped[section.type].sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    }

    return grouped;
  }, [serverDocuments]);

  const replacementSection = documentReplacementCandidate
    ? DOCUMENT_SECTIONS.find((section) => section.type === documentReplacementCandidate.type)
    : null;
  const replacementHasStoredDoc = Boolean(
    documentReplacementCandidate &&
      (documentsByType[documentReplacementCandidate.type]?.length ?? 0) > 0,
  );

  const handleDocumentFileChange = (type: DocumentSectionType, files: File[]) => {
    const normalizedFiles = files.slice(0, 1);

    if (normalizedFiles.length === 0) {
      setDocumentFiles((prev) => ({ ...prev, [type]: [] }));
      return;
    }

    const hasExistingDocument = (documentsByType[type]?.length ?? 0) > 0;
    const hasPendingSelection = (documentFiles[type]?.length ?? 0) > 0;

    if (hasExistingDocument || hasPendingSelection) {
      setDocumentReplacementCandidate({ type, files: normalizedFiles });
      return;
    }

    setDeferredUploads((prev) => ({ ...prev, [type]: false }));
    setDocumentFiles((prev) => ({ ...prev, [type]: normalizedFiles }));
  };

  const handleDeferredToggle = (type: DocumentSectionType, checked: boolean) => {
    setDeferredUploads((prev) => ({ ...prev, [type]: checked }));
    if (checked) {
      setDocumentFiles((prev) => ({ ...prev, [type]: [] }));
    }
  };

  const handleConfirmDocumentRemoval = useCallback(async () => {
    if (!documentPendingRemoval || !existingPatient) return;
    setDocumentRemovingId(documentPendingRemoval.id);
    const result = await deletePatientDocumentAction({
      documentId: documentPendingRemoval.id,
      patientId: existingPatient.id,
      orgSlug,
    });

    if (!result.success) {
      toast.error(result.error ?? "Unable to delete document");
    } else {
      toast.success(result.message ?? "Document removed");
      setServerDocuments((prev) => prev.filter((doc) => doc.id !== documentPendingRemoval.id));
    }

    setDocumentRemovingId(null);
    setDocumentPendingRemoval(null);
  }, [documentPendingRemoval, existingPatient, orgSlug]);

  const handleConfirmReplacement = useCallback(() => {
    if (!documentReplacementCandidate) return;
    const { type, files } = documentReplacementCandidate;
    setDeferredUploads((prev) => ({ ...prev, [type]: false }));
    setDocumentFiles((prev) => ({ ...prev, [type]: files }));
    setDocumentReplacementCandidate(null);
  }, [documentReplacementCandidate]);

  const handleCancelReplacement = useCallback(() => {
    setDocumentReplacementCandidate(null);
  }, []);

  const uploadDocumentsForPatient = useCallback(
    async (patientId: string) => {
      for (const section of DOCUMENT_SECTIONS) {
        const files = documentFiles[section.type] ?? [];
        const shouldDefer = deferredUploads[section.type];

        if (!files.length && !shouldDefer) continue;

        if (files.length) {
          for (const file of files) {
            const formData = new FormData();
            formData.append("patientId", patientId);
            formData.append("documentType", section.type);
            formData.append("orgSlug", orgSlug);
            formData.append("file", file);

            const result = await uploadPatientDocumentAction(formData);
            if (!result.success) {
              toast.error(result.error ?? `Unable to upload ${file.name}`);
            }
          }
        }

        if (shouldDefer) {
          const formData = new FormData();
          formData.append("patientId", patientId);
          formData.append("documentType", section.type);
          formData.append("orgSlug", orgSlug);
          formData.append("uploadDeferred", "true");

          const result = await uploadPatientDocumentAction(formData);
          if (!result.success) {
            toast.error(result.error ?? `Unable to mark ${section.title} as pending`);
          }
        }
      }
    },
    [deferredUploads, documentFiles, orgSlug],
  );

  const submitForm = form.handleSubmit((values) => {
    startTransition(() => {
      void (async () => {
        const payload: UpsertPatientInput = {
          ...values,
          patientId: existingPatient?.id,
          orgSlug,
        };
        const result = await upsertPatientProfileAction(payload);

        if (!result.success) {
          toast.error(result.error ?? "Unable to save patient");
          if (result.errors) {
            Object.entries(result.errors).forEach(([field, messages]) => {
              const message = messages?.[0];
              if (!message) return;
              form.setError(field as FieldPath<CreatePatientFormValues>, { message });
            });
          }
          return;
        }

        toast.success(result.message ?? (existingPatient ? "Patient updated" : "Patient saved"));

        const patientId = result.data?.patientId ?? existingPatient?.id;
        if (patientId) {
          await uploadDocumentsForPatient(patientId);
          setDocumentFiles(createDocumentFileState());
          if (isEditMode) {
            router.refresh();
          } else {
            router.replace(`/${orgSlug}/patients/${patientId}/edit`);
          }
        } else {
          router.refresh();
        }
      })();
    });
  });

  return (
    <Form {...form}>
      <form id={formId} onSubmit={submitForm} className="flex flex-col gap-6 pb-24">
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="rounded-full bg-primary/10 p-2 text-primary">
                <IconInfoCircle className="h-4 w-4" />
              </span>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Unified patient intake
                </p>
                <p className="text-sm text-muted-foreground">
                  Work through every required detail once. Each section shows exactly what labs need
                  to move orders forward.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {OVERVIEW_CALLOUTS.map((callout) => (
                <div
                  key={callout.title}
                  className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground"
                >
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <IconCheck className="h-3.5 w-3.5 text-primary" />
                    {callout.title}
                  </div>
                  <p>{callout.body}</p>
                </div>
              ))}
            </div>
          </div>

          <PatientIdentityCard form={form} labs={labs} />

          <PatientContactCard form={form} />

          <PatientInsuranceCard
            form={form}
            fields={insurancePolicyFields}
            appendPolicy={appendInsurancePolicy}
            removePolicy={removeInsurancePolicy}
            isSubmitting={isPending}
          />

          <PatientBillingCard form={form} />

          <PatientDocumentsCard
            documentFiles={documentFiles}
            deferredUploads={deferredUploads}
            documentsByType={documentsByType}
            canDeleteDocuments={canDeleteDocuments}
            existingPatient={existingPatient}
            documentRemovingId={documentRemovingId}
            onDeferredToggle={handleDeferredToggle}
            onFileChange={handleDocumentFileChange}
            onRequestRemove={(document) => setDocumentPendingRemoval(document)}
          />

          <div className="grid gap-4">
            <PatientSnapshotCard values={snapshotValues} labs={labs} />
          </div>
        </div>

        <div className="sticky bottom-0 left-0 right-0 border-t bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Ready to save?</p>
              <p className="text-xs text-muted-foreground">
                {existingPatient
                  ? "Review details before saving changes."
                  : "Review details before creating patient."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : existingPatient ? "Save changes" : "Create patient"}
              </Button>
            </div>
          </div>
        </div>
      </form>
      <AlertDialog
        open={Boolean(documentPendingRemoval)}
        onOpenChange={(open) => {
          if (!open) setDocumentPendingRemoval(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action deletes{" "}
              <span className="font-semibold">
                {documentPendingRemoval?.fileName ?? "this file"}
              </span>{" "}
              from storage and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={documentRemovingId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void handleConfirmDocumentRemoval();
              }}
              disabled={documentRemovingId !== null}
            >
              {documentRemovingId !== null ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(documentReplacementCandidate)}
        onOpenChange={(open) => {
          if (!open) handleCancelReplacement();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace {replacementSection?.title ?? "document"}?</AlertDialogTitle>
            <AlertDialogDescription>
              {replacementHasStoredDoc
                ? "Uploading a new file will remove the version currently stored for this patient."
                : "This will replace the file you recently selected for upload."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelReplacement}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleConfirmReplacement();
              }}
            >
              Replace file
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}
