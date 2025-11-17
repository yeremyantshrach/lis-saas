import * as React from "react";

import { cn } from "@/lib/utils";

type TextareaProps = React.ComponentProps<"textarea"> & {
  showCount?: boolean;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, maxLength, showCount = true, onChange, value, defaultValue, ...props },
  ref,
) {
  const getLength = (input?: unknown): number => {
    if (typeof input === "string") return input.length;
    if (typeof input === "number") return String(input).length;
    if (Array.isArray(input)) return input.join("").length;
    return 0;
  };
  const [currentLength, setCurrentLength] = React.useState<number>(() =>
    getLength(value ?? defaultValue),
  );

  React.useEffect(() => {
    if (typeof value === "string") {
      setCurrentLength(value.length);
    } else if (value == null && typeof defaultValue === "string") {
      setCurrentLength(defaultValue.length);
    }
  }, [value, defaultValue]);

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    if (showCount && typeof maxLength === "number") {
      setCurrentLength(event.target.value.length);
    }

    onChange?.(event);
  };

  const shouldShowCount = showCount && typeof maxLength === "number";

  return (
    <div className="relative">
      <textarea
        ref={ref}
        data-slot="textarea"
        maxLength={maxLength}
        onChange={handleChange}
        {...(value !== undefined ? { value } : {})}
        {...(value === undefined && defaultValue !== undefined ? { defaultValue } : {})}
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm break-words break-all",
          shouldShowCount && "pr-12",
          className,
        )}
        {...props}
      />
      {shouldShowCount ? (
        <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-muted-foreground">
          {currentLength}/{maxLength}
        </span>
      ) : null}
    </div>
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
