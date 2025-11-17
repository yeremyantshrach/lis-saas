"use client";

import { useId, type ReactNode } from "react";
import type { FieldError as RHFFieldError } from "react-hook-form";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

type FieldOrientation = "vertical" | "horizontal" | "responsive";

interface WizardFieldProps {
  label: ReactNode;
  description?: ReactNode;
  error?: RHFFieldError;
  className?: string;
  orientation?: FieldOrientation;
  children: (props: {
    inputId: string;
    labelId: string;
    descriptionId?: string;
    errorId: string;
    describedBy?: string;
    isInvalid: boolean;
  }) => React.ReactNode;
}

export function WizardField({
  label,
  description,
  error,
  children,
  className,
  orientation,
}: WizardFieldProps) {
  const generatedId = useId();
  const inputId = `${generatedId}-input`;
  const labelId = `${generatedId}-label`;
  const descriptionId = description ? `${generatedId}-description` : undefined;
  const errorId = `${generatedId}-error`;
  const describedBy =
    [descriptionId, error ? errorId : undefined].filter(Boolean).join(" ") || undefined;
  const isInvalid = Boolean(error);

  return (
    <Field className={className} orientation={orientation} data-invalid={isInvalid || undefined}>
      <FieldLabel id={labelId} htmlFor={inputId}>
        {label}
      </FieldLabel>
      <FieldContent>
        {description ? <FieldDescription id={descriptionId}>{description}</FieldDescription> : null}
        {children({ inputId, labelId, descriptionId, errorId, describedBy, isInvalid })}
        <FieldError id={errorId} errors={error ? [error] : undefined} />
      </FieldContent>
    </Field>
  );
}
