import { Switch } from "@repo/ayasofyazilim-ui/components/switch";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Badge } from "../../../../components/badge";
import { Input } from "../../../../components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../../components/tooltip";
import { DatePicker } from "../../../../custom/date-picker";
import DateTooltip from "../../../../custom/date-tooltip";
import { cn } from "../../../../lib/utils";
import type { CellRendererProps, JSONSchemaProperty } from "../../types";
import { getTranslations } from "../../utils/translation-utils";

const DEBOUNCE_DELAY = 150;
const MAX_STRING_LENGTH = 100;
const MAX_ARRAY_DISPLAY = 3;

const BADGE_VARIANT_MAP: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  active: "default",
  inactive: "secondary",
  pending: "outline",
  success: "default",
  warning: "destructive",
  error: "destructive",
};

function createZodSchema(
  schemaProperty?: JSONSchemaProperty,
  t?: Record<string, string>
): z.ZodType {
  if (!schemaProperty) return z.any();

  let schema: z.ZodType;

  switch (schemaProperty.type) {
    case "string":
      schema = z.string({
        message: getTranslations("validation.invalidString", t),
      });

      if (schemaProperty.minLength !== undefined) {
        schema = (schema as z.ZodString).min(
          schemaProperty.minLength,
          t?.["validation.min_length"]
            ? (t["validation.min_length"] ?? "").replace(
                "{min}",
                String(schemaProperty.minLength)
              )
            : `Must be at least ${schemaProperty.minLength} characters`
        );
      }
      if (schemaProperty.maxLength !== undefined) {
        schema = (schema as z.ZodString).max(
          schemaProperty.maxLength,
          t?.["validation.max_length"]
            ? (t["validation.max_length"] ?? "").replace(
                "{max}",
                String(schemaProperty.maxLength)
              )
            : `Must be at most ${schemaProperty.maxLength} characters`
        );
      }

      if (schemaProperty.format === "email") {
        schema = (schema as z.ZodString).email(
          t?.["validation.invalid_email"] || "Must be a valid email address"
        );
      }
      if (schemaProperty.format === "uri" || schemaProperty.format === "url") {
        schema = z.url(t?.["validation.invalid_url"] || "Must be a valid URL");
      }
      if (schemaProperty.format === "uuid") {
        schema = z.uuid(
          t?.["validation.invalid_uuid"] || "Must be a valid UUID"
        );
      }
      break;

    case "number":
      schema = z.number({
        message: t?.["validation.invalid_number"] || "Must be a valid number",
      });

      if (schemaProperty.minimum !== undefined) {
        schema = (schema as z.ZodNumber).min(
          schemaProperty.minimum,
          t?.["validation.min_value"]
            ? (t["validation.min_value"] ?? "").replace(
                "{min}",
                String(schemaProperty.minimum)
              )
            : `Must be at least ${schemaProperty.minimum}`
        );
      }
      if (schemaProperty.maximum !== undefined) {
        schema = (schema as z.ZodNumber).max(
          schemaProperty.maximum,
          t?.["validation.max_value"]
            ? (t["validation.max_value"] ?? "").replace(
                "{max}",
                String(schemaProperty.maximum)
              )
            : `Must be at most ${schemaProperty.maximum}`
        );
      }
      break;

    case "integer":
      schema = z
        .number({
          message:
            t?.["validation.invalid_integer"] || "Must be a valid integer",
        })
        .int(t?.["validation.must_be_integer"] || "Must be an integer");

      if (schemaProperty.minimum !== undefined) {
        schema = (schema as z.ZodNumber).min(
          schemaProperty.minimum,
          t?.["validation.min_value"]
            ? (t["validation.min_value"] ?? "").replace(
                "{min}",
                String(schemaProperty.minimum)
              )
            : `Must be at least ${schemaProperty.minimum}`
        );
      }
      if (schemaProperty.maximum !== undefined) {
        schema = (schema as z.ZodNumber).max(
          schemaProperty.maximum,
          t?.["validation.max_value"]
            ? (t["validation.max_value"] ?? "").replace(
                "{max}",
                String(schemaProperty.maximum)
              )
            : `Must be at most ${schemaProperty.maximum}`
        );
      }
      break;

    case "boolean":
      schema = z.boolean({
        message: t?.["validation.invalid_boolean"] || "Must be true or false",
      });
      break;

    default:
      schema = z.any();
  }

  if (schemaProperty.enum && Array.isArray(schemaProperty.enum)) {
    schema = z.enum(
      schemaProperty.enum as [string, ...string[]],
      t?.["validation.invalid_enum"] || "Invalid value"
    );
  }

  if (!schemaProperty.required) {
    schema = schema.optional().nullable();
  }

  return schema;
}

interface ErrorWrapperProps {
  error: string | null;
  mode: "tooltip" | "inline" | "both";
  children: React.ReactNode;
}

function ErrorWrapper({ error, mode, children }: ErrorWrapperProps) {
  if (!error) return <>{children}</>;

  const showTooltip = mode === "tooltip" || mode === "both";
  const showInline = mode === "inline" || mode === "both";

  const inlineError = showInline && (
    <span className="text-[10px] text-destructive px-2 py-0.5 leading-tight animate-in fade-in slide-in-from-top-1">
      {error}
    </span>
  );

  if (showTooltip && !showInline) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          {error}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (showInline && !showTooltip) {
    return (
      <div className="flex flex-col w-full h-full">
        {children}
        {inlineError}
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col w-full h-full">
          {children}
          {inlineError}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        {error}
      </TooltipContent>
    </Tooltip>
  );
}

export function CellRenderer({
  value,
  schemaProperty,
  editable = false,
  onUpdate,
  t,
  error,
  className,
  dateOptions,
  localization,
  fieldName,
  customRenderers,
  errorDisplayMode = "tooltip",
}: CellRendererProps) {
  const [localValue, setLocalValue] = useState(value);
  const [validationError, setValidationError] = useState<string | null>(
    error || null
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout>(null);
  const datePickerIdRef = useRef<string>(
    `date-${schemaProperty?.title || "field"}-${Date.now()}`
  );
  const datePickerMountedRef = useRef<boolean>(false);
  const handleDateChangeRef = useRef<((date: Date) => void) | null>(null);

  const validationSchema = useMemo(
    () => (schemaProperty ? createZodSchema(schemaProperty, t) : null),
    [schemaProperty, t]
  );

  useEffect(() => {
    if (!editable) {
      setLocalValue(value);
      datePickerMountedRef.current = false;
    }
  }, [value, editable]);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const debouncedUpdate = useCallback(
    (newValue: unknown) => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(() => {
        if (onUpdate) {
          onUpdate(newValue);
        }
      }, DEBOUNCE_DELAY);
    },
    [onUpdate]
  );

  const handleChange = useCallback(
    (newValue: unknown) => {
      setLocalValue(newValue);

      const err = validationSchema
        ? (() => {
            const result = validationSchema.safeParse(newValue);
            return result.success
              ? null
              : result.error.issues[0]?.message || "Invalid value";
          })()
        : null;

      setValidationError(err);

      if (!err) {
        debouncedUpdate(newValue);
      }
    },
    [validationSchema, debouncedUpdate]
  );

  const inputClassName = useMemo(
    () =>
      cn(
        "h-full px-2 shadow-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0",
        validationError && "border border-destructive"
      ),
    [validationError]
  );

  if (editable && !schemaProperty?.readOnly) {
    if (fieldName && customRenderers?.byField?.[fieldName]) {
      const customRenderer = customRenderers.byField[fieldName]!;
      return (
        <>
          {customRenderer({
            value: localValue,
            onUpdate: handleChange,
            error: validationError || undefined,
            schemaProperty,
            t,
          })}
        </>
      );
    }

    if (
      schemaProperty?.format &&
      customRenderers?.byFormat?.[schemaProperty.format]
    ) {
      const customRenderer = customRenderers.byFormat[schemaProperty.format]!;
      return (
        <>
          {customRenderer({
            value: localValue,
            onUpdate: handleChange,
            error: validationError || undefined,
            schemaProperty,
            t,
          })}
        </>
      );
    }

    if (
      schemaProperty?.type &&
      customRenderers?.byType?.[schemaProperty.type]
    ) {
      const customRenderer = customRenderers.byType[schemaProperty.type]!;
      return (
        <>
          {customRenderer({
            value: localValue,
            onUpdate: handleChange,
            error: validationError || undefined,
            schemaProperty,
            t,
          })}
        </>
      );
    }

    if (schemaProperty?.type === "boolean" || typeof value === "boolean") {
      return (
        <ErrorWrapper error={validationError} mode={errorDisplayMode}>
          <div className="flex items-center px-2">
            <Switch
              checked={!!localValue}
              onCheckedChange={handleChange}
              className={validationError ? "border-destructive" : ""}
            />
          </div>
        </ErrorWrapper>
      );
    }

    if (schemaProperty?.enum && Array.isArray(schemaProperty.enum)) {
      return (
        <ErrorWrapper error={validationError} mode={errorDisplayMode}>
          <div className="w-full h-full flex items-center">
            <Select value={String(localValue)} onValueChange={handleChange}>
              <SelectTrigger
                size="sm"
                className={cn(
                  "h-[35px]! px-2 w-full shadow-none border-0 rounded-none focus:ring-0 focus:ring-offset-0",
                  validationError && "border border-destructive"
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {schemaProperty.enum.map((option) => (
                  <SelectItem key={String(option)} value={String(option)}>
                    {String(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </ErrorWrapper>
      );
    }

    if (
      schemaProperty?.type === "number" ||
      schemaProperty?.type === "integer"
    ) {
      const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val =
          schemaProperty.type === "integer"
            ? parseInt(e.target.value)
            : parseFloat(e.target.value);
        handleChange(isNaN(val) ? e.target.value : val);
      };

      return (
        <ErrorWrapper error={validationError} mode={errorDisplayMode}>
          <div className="w-full h-full flex items-center">
            <Input
              ref={inputRef}
              type="number"
              value={String(localValue ?? "")}
              onChange={handleNumberChange}
              className={inputClassName}
            />
          </div>
        </ErrorWrapper>
      );
    }

    if (
      schemaProperty?.format === "date" ||
      schemaProperty?.format === "date-time"
    ) {
      const dateValue =
        localValue instanceof Date
          ? localValue
          : localValue
            ? new Date(String(localValue))
            : undefined;

      const isDateTime = schemaProperty?.format === "date-time";

      if (!handleDateChangeRef.current) {
        handleDateChangeRef.current = (date: Date) => {
          if (!datePickerMountedRef.current) {
            datePickerMountedRef.current = true;
            return;
          }

          if (schemaProperty?.format === "date-time") {
            handleChange(date?.toISOString());
          } else {
            const isoDate = date?.toISOString().split("T")[0];
            handleChange(isoDate);
          }
        };
      }

      return (
        <ErrorWrapper error={validationError} mode={errorDisplayMode}>
          <DatePicker
            id={datePickerIdRef.current}
            showIcon={false}
            defaultValue={
              dateValue instanceof Date && !Number.isNaN(dateValue.getTime())
                ? dateValue
                : undefined
            }
            onChange={handleDateChangeRef.current}
            classNames={{
              dateInput: cn(
                "shadow-none border-0 h-8! rounded-none",
                validationError && "border border-destructive"
              ),
            }}
            useTime={isDateTime}
          />
        </ErrorWrapper>
      );
    }

    const inputType = schemaProperty?.format === "email" ? "email" : "text";

    return (
      <ErrorWrapper error={validationError} mode={errorDisplayMode}>
        <div className="w-full h-full flex items-center">
          <Input
            ref={inputRef}
            type={inputType}
            value={String(localValue ?? "")}
            onChange={(e) => handleChange(e.target.value)}
            className={inputClassName}
          />
        </div>
      </ErrorWrapper>
    );
  }

  if (value === null || value === undefined) {
    return (
      <span className={cn("text-muted-foreground italic", className)}>—</span>
    );
  }

  if (schemaProperty?.type === "boolean" || typeof value === "boolean") {
    const yesLabel = t?.["cell.boolean.yes"] ?? "Yes";
    const noLabel = t?.["cell.boolean.no"] ?? "No";
    return (
      <Badge variant={value ? "default" : "secondary"} className={className}>
        {value ? yesLabel : noLabel}
      </Badge>
    );
  }

  if (
    schemaProperty?.format === "date" ||
    schemaProperty?.format === "date-time"
  ) {
    try {
      const date = value instanceof Date ? value : new Date(value as string);

      const defaultLocalization = localization || {
        locale: "en-US",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        lang: "en",
      };

      const defaultDateOptions =
        dateOptions ||
        (schemaProperty.format === "date"
          ? {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }
          : {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });

      return (
        <DateTooltip
          date={date}
          localization={defaultLocalization}
          dateOptions={defaultDateOptions}
        />
      );
    } catch {
      return <span className={className}>{String(value)}</span>;
    }
  }

  if (schemaProperty?.enum && Array.isArray(schemaProperty.enum)) {
    return (
      <Badge variant="outline" className={cn("font-normal", className)}>
        {String(value)}
      </Badge>
    );
  }

  if (schemaProperty?.format === "badge") {
    const variant = BADGE_VARIANT_MAP[String(value).toLowerCase()] || "outline";
    return (
      <Badge variant={variant} className={className}>
        {String(value)}
      </Badge>
    );
  }

  if (schemaProperty?.format === "uri") {
    return (
      <a
        href={String(value)}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("text-primary hover:underline", className)}
        onClick={(e) => e.stopPropagation()}
      >
        {String(value)}
      </a>
    );
  }

  if (schemaProperty?.format === "uuid") {
    const uuid = String(value);
    return (
      <code className={cn("text-xs bg-muted  5 rounded", className)}>
        {uuid.slice(0, 8)}...
      </code>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.slice(0, MAX_ARRAY_DISPLAY).map((item, idx) => (
          <Badge key={idx} variant="secondary" className="text-xs">
            {String(item)}
          </Badge>
        ))}
        {value.length > MAX_ARRAY_DISPLAY && (
          <Badge variant="outline" className="text-xs">
            +{value.length - MAX_ARRAY_DISPLAY}
          </Badge>
        )}
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <code className={cn("text-xs bg-muted  5 rounded", className)}>
        {JSON.stringify(value)}
      </code>
    );
  }

  const strValue = String(value);

  if (strValue.length > MAX_STRING_LENGTH) {
    return (
      <span title={strValue} className={className}>
        {strValue.slice(0, MAX_STRING_LENGTH)}...
      </span>
    );
  }

  return <span className={className}>{strValue}</span>;
}
