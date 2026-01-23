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

type FilterValue = string | number | boolean | string[] | undefined;

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
      initial[f.key] = f.type === "array" ? [] : undefined;
    });
    setLocalValues(initial);
    setErrors({});
    setResetCount((prev) => prev + 1);
    startTransition(() => router.push(pathname, { scroll: false }));
  };

  const clearSingleFilter = useCallback((filter: ServerFilterConfig) => {
    const emptyValue =
      filter.type === "array" ? [] : filter.type === "boolean" ? undefined : "";
    setLocalValues((prev) => ({ ...prev, [filter.key]: emptyValue }));
    setErrors((prev) => ({ ...prev, [filter.key]: "" }));
    if (["select", "array", "boolean"].includes(filter.type)) {
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
                        ? value.includes(opt.value)
                        : String(value) === opt.value
                    )}
                    getKey={(opt) => opt.value}
                    getLabel={(opt) => opt.label}
                    onChange={(selected) => {
                      const values = selected.map((s) => s.value);
                      onValueChange(
                        filter,
                        filter.type === "array"
                          ? values
                          : values[0] || undefined
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
