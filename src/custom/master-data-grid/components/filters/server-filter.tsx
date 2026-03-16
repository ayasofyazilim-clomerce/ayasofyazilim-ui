"use client";

import { Button } from "@repo/ayasofyazilim-ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@repo/ayasofyazilim-ui/components/field";
import { Selectable } from "@repo/ayasofyazilim-ui/custom/selectable";
import { Loader2, RotateCcw, Search, XCircle } from "lucide-react";
import {
  DatePicker,
  DateRangePicker,
} from "@repo/ayasofyazilim-ui/custom/date-picker";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { ServerFilterConfig } from "../../types";
import { BaseMultiFilterDialogProps } from "./multi-filter-dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@repo/ayasofyazilim-ui/components/input-group";
import {
  ScrollArea,
  ScrollBar,
} from "@repo/ayasofyazilim-ui/components/scroll-area";
import { getTranslations } from "../../utils";

type DateRangeValue = { from: string | undefined; to: string | undefined };

type FilterValue =
  | string
  | number
  | boolean
  | Array<string | boolean>
  | DateRangeValue
  | undefined;

export function ServerFilterContent<TData>({
  config,
}: BaseMultiFilterDialogProps<TData>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const { serverFilters } = config;
  if (!serverFilters) return null;

  const [resetCount, setResetCount] = useState(0);

  const [localValues, setLocalValues] = useState<Record<string, FilterValue>>(
    () => {
      const initial: Record<string, FilterValue> = {};
      serverFilters.forEach((filter) => {
        const val = searchParams.get(filter.key);
        if (filter.type === "array") {
          initial[filter.key] = searchParams.getAll(filter.key);
        } else if (filter.type === "boolean") {
          initial[filter.key] =
            val === "true" ? true : val === "false" ? false : undefined;
        } else if (filter.type === "number") {
          initial[filter.key] = val ? Number(val) : undefined;
        } else if (filter.type === "date-range") {
          initial[filter.key] = {
            from: searchParams.get(filter.keyFrom) || undefined,
            to: searchParams.get(filter.keyTo) || undefined,
          };
        } else {
          initial[filter.key] = val || undefined;
        }
      });
      return initial;
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const onValueChange = useCallback(
    (filter: ServerFilterConfig, rawValue: FilterValue) => {
      let processedValue: FilterValue = rawValue;
      if (
        rawValue === "" ||
        (Array.isArray(rawValue) && rawValue.length === 0)
      ) {
        processedValue = undefined;
      }

      if (filter.validator) {
        const result = filter.validator.safeParse(processedValue);
        setErrors((prev) => ({
          ...prev,
          [filter.key]: result.success
            ? ""
            : result.error.issues[0]?.message || "Hata",
        }));
      }

      setLocalValues((prev) => ({ ...prev, [filter.key]: processedValue }));
    },
    []
  );

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    let hasValidationError = false;

    serverFilters.forEach((filter) => {
      const val = localValues[filter.key];

      if (filter.type === "date-range") {
        params.delete(filter.keyFrom);
        params.delete(filter.keyTo);
        const rangeVal = val as DateRangeValue | undefined;
        if (rangeVal?.from) params.set(filter.keyFrom, rangeVal.from);
        if (rangeVal?.to) params.set(filter.keyTo, rangeVal.to);
        return;
      }

      params.delete(filter.key);
      const isEmpty =
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0);

      if (!isEmpty) {
        if (filter.validator) {
          const result = filter.validator.safeParse(val);
          if (!result.success) {
            hasValidationError = true;
            setErrors((prev) => ({
              ...prev,
              [filter.key]: result.error.issues[0]?.message || "Hata",
            }));
            return;
          }
        }
        if (Array.isArray(val)) {
          val.forEach((v) => params.append(filter.key, String(v)));
        } else {
          params.set(filter.key, String(val));
        }
      } else {
        setErrors((prev) => ({ ...prev, [filter.key]: "" }));
      }
    });
    if (hasValidationError) return;
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const handleReset = () => {
    const initial: Record<string, FilterValue> = {};
    serverFilters.forEach((f) => {
      if (f.type === "array") {
        initial[f.key] = [];
      } else if (f.type === "date-range") {
        initial[f.key] = { from: undefined, to: undefined };
      } else {
        initial[f.key] = undefined;
      }
    });
    setLocalValues(initial);
    setErrors({});
    setResetCount((prev) => prev + 1);
    startTransition(() => router.push(pathname, { scroll: false }));
  };

  const clearSingleFilter = useCallback((filter: ServerFilterConfig) => {
    const emptyValue =
      filter.type === "array"
        ? []
        : filter.type === "boolean"
          ? undefined
          : filter.type === "date-range"
            ? { from: undefined, to: undefined }
            : "";
    setLocalValues((prev) => ({ ...prev, [filter.key]: emptyValue }));
    setErrors((prev) => ({ ...prev, [filter.key]: "" }));
    if (
      ["select", "array", "boolean", "date", "date-range"].includes(filter.type)
    ) {
      setResetCount((prev) => prev + 1);
    }
  }, []);

  return (
    <FieldSet className="p-2">
      <ScrollArea className="pr-4">
        <ScrollBar />
        <FieldGroup className={"gap-3 max-h-80"}>
          {serverFilters.map((filter) => {
            const value = localValues[filter.key];

            if (filter.type === "date") {
              const dateVal = value as string | undefined;
              return (
                <Field key={`${filter.key}-${resetCount}`} className="gap-1">
                  <FieldLabel htmlFor={filter.key}>{filter.label}</FieldLabel>
                  <div className="relative">
                    <DatePicker
                      id={filter.key}
                      defaultValue={dateVal ? new Date(dateVal) : undefined}
                      onChange={(date) =>
                        onValueChange(
                          filter,
                          date ? date.toISOString() : undefined
                        )
                      }
                    />
                    {dateVal && (
                      <button
                        type="button"
                        className="absolute right-9 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => clearSingleFilter(filter)}
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {errors[filter.key] && (
                    <FieldError>{errors[filter.key]}</FieldError>
                  )}
                </Field>
              );
            }

            if (filter.type === "date-range") {
              const rangeVal = value as DateRangeValue | undefined;
              return (
                <Field key={`${filter.key}-${resetCount}`} className="gap-1">
                  <FieldLabel>{filter.label}</FieldLabel>
                  <div className="relative">
                    <DateRangePicker
                      id={filter.key}
                      defaultValues={{
                        start: rangeVal?.from
                          ? new Date(rangeVal.from)
                          : undefined,
                        end: rangeVal?.to ? new Date(rangeVal.to) : undefined,
                      }}
                      onChange={(range) =>
                        onValueChange(filter, {
                          from: range.start?.toISOString(),
                          to: range.end?.toISOString(),
                        })
                      }
                    />
                    {(rangeVal?.from || rangeVal?.to) && (
                      <button
                        type="button"
                        className="absolute right-9 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => clearSingleFilter(filter)}
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {errors[filter.key] && (
                    <FieldError>{errors[filter.key]}</FieldError>
                  )}
                </Field>
              );
            }

            const isSelectable =
              filter.type === "select" ||
              filter.type === "array" ||
              filter.type === "boolean";
            if (isSelectable) {
              return (
                <Field key={filter.key} className="gap-1">
                  <FieldLabel htmlFor={filter.key}>{filter.label}</FieldLabel>
                  <Selectable
                    id={filter.key}
                    key={`${filter.key}-${resetCount}`}
                    singular={filter.type !== "array"}
                    options={filter.options}
                    defaultValue={filter.options.filter((opt) =>
                      Array.isArray(value)
                        ? value.some(
                            (v) =>
                              v === opt.value || String(v) === String(opt.value)
                          )
                        : value === opt.value ||
                          String(value) === String(opt.value)
                    )}
                    getKey={(opt) => String(opt.value)}
                    getLabel={(opt) => opt.label}
                    onChange={(selected) => {
                      const values = selected.map((s) => s.value);
                      onValueChange(
                        filter,
                        filter.type === "array"
                          ? values
                          : values[0] ?? undefined
                      );
                    }}
                    searchPlaceholderText={filter.placeholder}
                    makeAChoiceText={filter.placeholder}
                  />
                  {errors[filter.key] && (
                    <FieldError>{errors[filter.key]}</FieldError>
                  )}
                </Field>
              );
            }
            return (
              <Field key={filter.key} className="gap-1">
                <FieldLabel htmlFor={filter.key}>{filter.label}</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id={filter.key}
                    type={filter.type === "number" ? "number" : "text"}
                    value={
                      typeof value === "boolean" || typeof value === "object"
                        ? ""
                        : value ?? ""
                    }
                    placeholder={filter.placeholder}
                    onKeyDown={(e) => e.key === "Enter" && handleApply()}
                    onChange={(e) => onValueChange(filter, e.target.value)}
                    className={errors[filter.key] ? "border-destructive" : ""}
                  />
                  {localValues[filter.key] && (
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        onClick={() => clearSingleFilter(filter)}
                      >
                        <XCircle />
                      </InputGroupButton>
                    </InputGroupAddon>
                  )}
                </InputGroup>
                {errors[filter.key] && (
                  <FieldError>{errors[filter.key]}</FieldError>
                )}
              </Field>
            );
          })}
        </FieldGroup>
      </ScrollArea>
      <Field orientation="horizontal">
        <Button
          type="button"
          variant="ghost"
          onClick={handleReset}
          disabled={isPending}
        >
          <RotateCcw className="mr-2 h-4 w-4" />{" "}
          {getTranslations("filter.clear", config.t)}
        </Button>
        <Button type="button" onClick={handleApply} disabled={isPending}>
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          {getTranslations("filter.apply", config.t)}
        </Button>
      </Field>
    </FieldSet>
  );
}
