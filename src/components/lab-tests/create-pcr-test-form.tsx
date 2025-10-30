"use client";

import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { useForm, useFieldArray, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createPcrTestSchema, type CreatePcrTestFormValues } from "@/lib/validations/lab-tests";
import {
  ANTIBIOTIC_CLASSES,
  PATHOGEN_CATEGORIES,
  PCR_SAMPLE_TYPES,
  PCR_TEST_PANELS,
} from "@/lib/lab-tests/constants";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createPcrTestAction, updatePcrTestAction } from "@/lib/actions/lab-test-actions";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { IconChevronDown, IconInfoCircle, IconPlus, IconTrash } from "@tabler/icons-react";
import type { PcrLabTestRecord } from "@/lib/helpers/lab-tests-helpers";

interface CreatePcrTestFormProps {
  labs: { id: string; name: string }[];
  defaultLabId?: string | null;
  orgSlug: string;
  showLoincField?: boolean;
  showCptField?: boolean;
  mode?: "create" | "edit";
  initialData?: PcrLabTestRecord | null;
  onSuccess: () => void;
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-4 rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm"
      role="group"
    >
      <header className="space-y-1">
        <h2 id={headingId} className="text-base font-semibold leading-none tracking-tight">
          {title}
        </h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

function CollapsibleFormSection({
  title,
  description,
  summary,
  actions,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  description?: string;
  summary?: React.ReactNode;
  actions?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const headingId = useId();

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <section
        aria-labelledby={headingId}
        className="space-y-4 rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm"
        role="group"
      >
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 id={headingId} className="text-base font-semibold leading-none tracking-tight">
                {title}
              </h2>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 shrink-0 rounded-full border border-border/60"
                  aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
                >
                  <IconChevronDown
                    className={cn("h-4 w-4 transition-transform", open ? "rotate-180" : "")}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
            {summary ? <div className="text-sm text-muted-foreground">{summary}</div> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
        <CollapsibleContent className="space-y-4">{children}</CollapsibleContent>
      </section>
    </Collapsible>
  );
}

export function CreatePcrTestForm({
  labs,
  defaultLabId,
  orgSlug,
  showLoincField = false,
  showCptField = false,
  mode = "create",
  initialData = null,
  onSuccess,
}: CreatePcrTestFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isPathogenOpen, setIsPathogenOpen] = useState(true);
  const [isResistanceOpen, setIsResistanceOpen] = useState(true);

  const labOptions = useMemo(() => labs, [labs]);
  const shouldShowLabSelect = labOptions.length > 1;

  const fallbackPathogen: CreatePcrTestFormValues["pathogenTargets"][number] = useMemo(
    () => ({
      name: "",
      category: PATHOGEN_CATEGORIES[0],
      clinicalSignificance: undefined,
    }),
    [],
  );

  const defaultValues = useMemo<CreatePcrTestFormValues>(() => {
    if (mode === "edit" && initialData) {
      const sanitizedPathogens: CreatePcrTestFormValues["pathogenTargets"] = (
        initialData.pathogenTargets.length > 0 ? initialData.pathogenTargets : [fallbackPathogen]
      ).map((pathogen) => ({
        name: pathogen.name,
        category: pathogen.category,
        clinicalSignificance: pathogen.clinicalSignificance ?? undefined,
      }));

      const sanitizedMarkers: CreatePcrTestFormValues["resistanceMarkers"] = (
        initialData.resistanceMarkers ?? []
      ).map((marker) => ({
        markerName: marker.markerName,
        gene: marker.gene,
        antibioticClass: marker.antibioticClass,
        clinicalImplication: marker.clinicalImplication ?? undefined,
      }));

      return {
        labId: initialData.labId,
        testName: initialData.testName,
        testCode: initialData.testCode ?? undefined,
        panel: initialData.panel,
        sampleType: initialData.sampleType,
        price: initialData.price ?? "",
        pathogenTargets: sanitizedPathogens,
        resistanceMarkers: sanitizedMarkers,
        loincCode: initialData.loincCode ?? undefined,
        cptCode: initialData.cptCode ?? undefined,
        description: initialData.description ?? undefined,
        defaultClinicalNotes: initialData.defaultClinicalNotes ?? undefined,
        orgSlug,
      };
    }

    return {
      labId: defaultLabId ?? (labOptions.length === 1 ? labOptions[0]?.id : undefined),
      testName: "",
      testCode: undefined,
      panel: PCR_TEST_PANELS[0],
      sampleType: PCR_SAMPLE_TYPES[0],
      price: "",
      pathogenTargets: [fallbackPathogen],
      resistanceMarkers: [],
      loincCode: undefined,
      cptCode: undefined,
      description: undefined,
      defaultClinicalNotes: undefined,
      orgSlug,
    };
  }, [mode, initialData, defaultLabId, labOptions, orgSlug, fallbackPathogen]);

  const form = useForm<CreatePcrTestFormValues>({
    resolver: zodResolver(createPcrTestSchema),
    defaultValues,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const {
    fields: pathogenFields,
    append: appendPathogen,
    remove: removePathogen,
  } = useFieldArray({ control: form.control, name: "pathogenTargets" });

  const {
    fields: resistanceFields,
    append: appendResistanceMarker,
    remove: removeResistanceMarker,
  } = useFieldArray({ control: form.control, name: "resistanceMarkers" });

  const pathogenValues: CreatePcrTestFormValues["pathogenTargets"] =
    form.watch("pathogenTargets") ?? [];
  const resistanceValues: CreatePcrTestFormValues["resistanceMarkers"] =
    form.watch("resistanceMarkers") ?? [];

  const pathogenSummary = pathogenValues.length ? (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span>
        {pathogenValues.length} {pathogenValues.length === 1 ? "pathogen" : "pathogens"}
      </span>
      {pathogenValues[0]?.name ? (
        <span className="font-medium text-foreground">
          {pathogenValues[0].name}
          {pathogenValues[0]?.category ? ` (${pathogenValues[0].category})` : ""}
          {pathogenValues.length > 1 ? ` +${pathogenValues.length - 1} more` : ""}
        </span>
      ) : null}
    </div>
  ) : (
    "No pathogens added yet."
  );

  const resistanceSummary = resistanceValues.length ? (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span>
        {resistanceValues.length} {resistanceValues.length === 1 ? "marker" : "markers"}
      </span>
      {resistanceValues[0]?.markerName ? (
        <span className="font-medium text-foreground">
          {resistanceValues[0].markerName}
          {resistanceValues[0]?.gene ? ` (${resistanceValues[0].gene})` : ""}
          {resistanceValues.length > 1 ? ` +${resistanceValues.length - 1} more` : ""}
        </span>
      ) : null}
    </div>
  ) : (
    "No markers added yet."
  );

  const handleSubmit = (values: CreatePcrTestFormValues) => {
    startTransition(async () => {
      try {
        if (mode === "edit") {
          if (!initialData) {
            form.setError("root", { message: "Unable to determine which test to update." });
            return;
          }

          const result = await updatePcrTestAction({
            ...values,
            id: initialData.id,
            labId: values.labId ?? initialData.labId,
          });

          if (result.success) {
            router.refresh();
            form.reset({
              ...values,
              labId: values.labId ?? initialData.labId,
            });
            onSuccess();
          } else if (result.errors) {
            Object.entries(result.errors).forEach(([field, messages]) => {
              const message = messages?.[0];
              if (message) {
                form.setError(field as FieldPath<CreatePcrTestFormValues>, { message });
              }
            });
          } else if (result.error) {
            form.setError("root", { message: result.error });
          }

          return;
        }

        const result = await createPcrTestAction(values);
        if (result.success) {
          router.refresh();
          form.reset({
            labId: shouldShowLabSelect
              ? values.labId
              : labOptions.length === 1
                ? labOptions[0]?.id
                : undefined,
            testName: "",
            testCode: undefined,
            panel: values.panel,
            sampleType: values.sampleType,
            price: "",
            pathogenTargets: [
              { name: "", category: PATHOGEN_CATEGORIES[0], clinicalSignificance: undefined },
            ],
            resistanceMarkers: [],
            loincCode: undefined,
            cptCode: undefined,
            description: undefined,
            defaultClinicalNotes: undefined,
            orgSlug,
          });
          onSuccess();
        } else if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            const message = messages?.[0];
            if (message) {
              form.setError(field as FieldPath<CreatePcrTestFormValues>, { message });
            }
          });
        } else if (result.error) {
          form.setError("root", { message: result.error });
        }
      } catch (error) {
        console.error("Failed to submit PCR test form", error);
        form.setError("root", { message: "Something went wrong. Please try again." });
      }
    });
  };

  const disabled = isPending;
  const isFormValid = form.formState.isValid;
  const submitLabel = disabled ? "Saving..." : mode === "edit" ? "Save changes" : "Save PCR Test";
  const resetLabel = mode === "edit" ? "Reset changes" : "Reset form";
  const labSelectDisabled = disabled || mode === "edit";
  const submitDisabled = disabled || !isFormValid;
  const requiredIndicator = <span className="text-destructive ml-1">*</span>;

  const pathogenTargetsError =
    form.formState.errors.pathogenTargets &&
    !Array.isArray(form.formState.errors.pathogenTargets) &&
    "message" in form.formState.errors.pathogenTargets
      ? (form.formState.errors.pathogenTargets.message as string | undefined)
      : undefined;

  const resistanceMarkersError =
    form.formState.errors.resistanceMarkers &&
    !Array.isArray(form.formState.errors.resistanceMarkers) &&
    "message" in form.formState.errors.resistanceMarkers
      ? (form.formState.errors.resistanceMarkers.message as string | undefined)
      : undefined;

  return (
    <Form {...form}>
      <TooltipProvider delayDuration={150}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormSection
            title="Test basics"
            description="Provide the identifiers the LIS uses to route, price, and categorize this assay."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {shouldShowLabSelect ? (
                <FormField
                  control={form.control}
                  name="labId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>
                        Owning lab
                        {requiredIndicator}
                      </FormLabel>
                      <Select
                        disabled={labSelectDisabled}
                        value={field.value}
                        onValueChange={(value) => field.onChange(value)}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full" aria-required="true">
                            <SelectValue placeholder="Select lab" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {labOptions.map((lab) => (
                            <SelectItem key={lab.id} value={lab.id}>
                              {lab.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {mode === "edit"
                          ? "Lab ownership is managed separately. Contact an administrator to move this test."
                          : "Determines which team sees and maintains this test."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              <FormField
                control={form.control}
                name="testName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>
                      Test name
                      {requiredIndicator}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Nail Fungus PCR"
                        disabled={disabled}
                        required
                        aria-required="true"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Shown on orders, reports, and internal dashboards.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="testCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Auto-generates when left blank"
                        disabled={disabled}
                        value={field.value ?? ""}
                        onChange={(event) =>
                          field.onChange(event.target.value ? event.target.value : undefined)
                        }
                        onBlur={(event) =>
                          field.onChange(
                            event.target.value.trim() ? event.target.value.trim() : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Format: PCR-123-45. Useful for requisitions and billing.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Price
                      {requiredIndicator}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          inputMode="decimal"
                          disabled={disabled}
                          className="pl-7"
                          placeholder="0.00"
                          required
                          aria-required="true"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Displayed to ordering providers and used in invoices.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="panel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Panel
                      {requiredIndicator}
                    </FormLabel>
                    <Select
                      disabled={disabled}
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full" aria-required="true">
                          <SelectValue placeholder="Select panel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PCR_TEST_PANELS.map((panel) => (
                          <SelectItem key={panel} value={panel}>
                            {panel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sampleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Sample type
                      {requiredIndicator}
                    </FormLabel>
                    <Select
                      disabled={disabled}
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full" aria-required="true">
                          <SelectValue placeholder="Select sample" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PCR_SAMPLE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>

          <div className="space-y-6">
            <CollapsibleFormSection
              title="Pathogen targets"
              description="List each organism detected by this PCR assay so interpretations can be specific and actionable."
              summary={pathogenSummary}
              actions={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    appendPathogen({
                      name: "",
                      category: PATHOGEN_CATEGORIES[0],
                      clinicalSignificance: undefined,
                    })
                  }
                  disabled={disabled}
                  className="sm:self-start"
                >
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add pathogen
                </Button>
              }
              open={isPathogenOpen}
              onOpenChange={setIsPathogenOpen}
            >
              <FormField
                control={form.control}
                name="pathogenTargets"
                render={({ field: _field }) => (
                  <FormItem className="space-y-4">
                    <FormDescription className="max-w-xl">
                      At least one pathogen is required. Add more to capture co-detections or panel
                      coverage.
                    </FormDescription>

                    <div className="space-y-4">
                      {pathogenFields.map((field, index) => {
                        const baseName = `pathogenTargets.${index}` as const;
                        const canRemove = pathogenFields.length > 1;
                        return (
                          <div
                            key={field.id}
                            className="space-y-4 rounded-lg border border-border/60 bg-background p-4"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold">Pathogen {index + 1}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removePathogen(index)}
                                disabled={disabled || !canRemove}
                                aria-label={`Remove pathogen ${index + 1}`}
                              >
                                <IconTrash className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-3">
                              <FormField
                                control={form.control}
                                name={`${baseName}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      Scientific name
                                      {requiredIndicator}
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g. Candida albicans"
                                        disabled={disabled}
                                        required
                                        aria-required="true"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`${baseName}.category`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      Category
                                      {requiredIndicator}
                                    </FormLabel>
                                    <Select
                                      disabled={disabled}
                                      value={field.value}
                                      onValueChange={(value) => field.onChange(value)}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="w-full" aria-required="true">
                                          <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {PATHOGEN_CATEGORIES.map((category) => (
                                          <SelectItem key={category} value={category}>
                                            {category}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`${baseName}.clinicalSignificance`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Clinical significance</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Optional. e.g. Common culprit in onychomycosis for immunocompromised patients."
                                        disabled={disabled}
                                        value={field.value ?? ""}
                                        onChange={(event) =>
                                          field.onChange(
                                            event.target.value ? event.target.value : undefined,
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {pathogenTargetsError ? (
                      <FormMessage>{pathogenTargetsError}</FormMessage>
                    ) : null}
                  </FormItem>
                )}
              />
            </CollapsibleFormSection>

            <CollapsibleFormSection
              title="Resistance markers"
              description="Document genetic markers that influence antimicrobial therapy."
              summary={resistanceSummary}
              actions={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    appendResistanceMarker({
                      markerName: "",
                      gene: "",
                      antibioticClass: "",
                      clinicalImplication: undefined,
                    })
                  }
                  disabled={disabled}
                  className="sm:self-start"
                >
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add marker
                </Button>
              }
              open={isResistanceOpen}
              onOpenChange={setIsResistanceOpen}
            >
              <FormField
                control={form.control}
                name="resistanceMarkers"
                render={({ field: _field }) => (
                  <FormItem className="space-y-4">
                    <FormDescription className="max-w-xl">
                      Optional. Great for stewardship teams and automated interpretive comments.
                    </FormDescription>

                    {resistanceFields.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                        No resistance markers recorded.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {resistanceFields.map((field, index) => {
                          const fieldName = `resistanceMarkers.${index}` as const;
                          return (
                            <div
                              key={field.id}
                              className="space-y-4 rounded-lg border border-border/60 bg-background p-4"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">Marker {index + 1}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeResistanceMarker(index)}
                                  disabled={disabled}
                                  aria-label={`Remove marker ${index + 1}`}
                                >
                                  <IconTrash className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid gap-4 lg:grid-cols-4">
                                <FormField
                                  control={form.control}
                                  name={`${fieldName}.markerName`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>
                                        Marker name
                                        {requiredIndicator}
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="e.g. mecA"
                                          disabled={disabled}
                                          required
                                          aria-required="true"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`${fieldName}.gene`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>
                                        Gene
                                        {requiredIndicator}
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="e.g. MECA"
                                          disabled={disabled}
                                          required
                                          aria-required="true"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`${fieldName}.antibioticClass`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>
                                        Antibiotic class
                                        {requiredIndicator}
                                      </FormLabel>
                                      <Select
                                        disabled={disabled}
                                        value={field.value ?? ""}
                                        onValueChange={(value) => field.onChange(value)}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="w-full" aria-required="true">
                                            <SelectValue placeholder="Select class" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {ANTIBIOTIC_CLASSES.map((item) => (
                                            <SelectItem key={item} value={item}>
                                              {item}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`${fieldName}.clinicalImplication`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Clinical implication</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Optional. e.g. Confers decreased susceptibility to beta-lactams."
                                          disabled={disabled}
                                          value={field.value ?? ""}
                                          onChange={(event) =>
                                            field.onChange(
                                              event.target.value ? event.target.value : undefined,
                                            )
                                          }
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {resistanceMarkersError ? (
                      <FormMessage>{resistanceMarkersError}</FormMessage>
                    ) : null}
                  </FormItem>
                )}
              />
            </CollapsibleFormSection>
          </div>

          <FormSection
            title="Reporting & billing"
            description="Provide optional metadata that enriches reports and downstream integrations."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Public description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional. Describe what this test covers or when to order it."
                        className="min-h-24"
                        disabled={disabled}
                        value={field.value ?? ""}
                        onChange={(event) =>
                          field.onChange(event.target.value ? event.target.value : undefined)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Appears in clinician-facing ordering workflows.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultClinicalNotes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Default clinical notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional. Pre-populated interpretation for reports."
                        className="min-h-24"
                        disabled={disabled}
                        value={field.value ?? ""}
                        onChange={(event) =>
                          field.onChange(event.target.value ? event.target.value : undefined)
                        }
                      />
                    </FormControl>
                    <FormDescription>Displayed to clinicians on result delivery.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showLoincField ? (
                <FormField
                  control={form.control}
                  name="loincCode"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>LOINC code</FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <IconInfoCircle className="size-4" aria-hidden="true" />
                              <span className="sr-only">LOINC code guidelines</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Format: five digits, a dash, then one digit (e.g., 92130-7). Whitespace
                            is removed automatically.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="e.g. 92130-7"
                          disabled={disabled}
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(event.target.value ? event.target.value : undefined)
                          }
                          onBlur={(event) =>
                            field.onChange(
                              event.target.value.trim() ? event.target.value.trim() : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Required for LIS/LIMS integrations when available.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              {showCptField ? (
                <FormField
                  control={form.control}
                  name="cptCode"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>CPT code</FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <IconInfoCircle className="size-4" aria-hidden="true" />
                              <span className="sr-only">CPT code guidelines</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            CPT codes contain exactly five numeric digits (e.g., 87507).
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="e.g. 87507"
                          disabled={disabled}
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(event.target.value ? event.target.value : undefined)
                          }
                          onBlur={(event) =>
                            field.onChange(
                              event.target.value.trim() ? event.target.value.trim() : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Populate when billing to payers or RCM systems.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </div>
          </FormSection>

          {form.formState.errors.root?.message ? (
            <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
          ) : null}

          <div className="flex gap-2 border-t pt-4">
            <Button type="submit" disabled={submitDisabled} className="min-w-[160px]">
              {submitLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => form.reset(defaultValues)}
            >
              {resetLabel}
            </Button>
          </div>
        </form>
      </TooltipProvider>
    </Form>
  );
}
