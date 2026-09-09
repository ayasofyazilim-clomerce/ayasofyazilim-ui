"use client";

import { Button } from "@repo/ayasofyazilim-ui/components/button";
import {
  Field,
  FieldGroup,
  FieldSet,
} from "@repo/ayasofyazilim-ui/components/field";
import { Loader2, RotateCcw, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { ServerFilterConfig } from "../../types";
import type { ServerFilterValue } from "../../utils/server-filter-utils";
import { BaseMultiFilterDialogProps } from "./multi-filter-dialog";
import { FilterValueEditor } from "./filter-value-editor";
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
  const { locale } = config;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const { serverFilters } = config;

  const [resetCount, setResetCount] = useState(0);

  const [localValues, setLocalValues] = useState<Record<string, FilterValue>>(
    () => {
      const initial: Record<string, FilterValue> = {};
      serverFilters?.forEach((filter) => {
        const val = searchParams.get(filter.key);
        if (filter.type === "array" || filter.type === "string-array") {
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
        if (processedValue !== undefined) {
          const result = filter.validator.safeParse(processedValue);
          setErrors((prev) => ({
            ...prev,
            [filter.key]: result.success
              ? ""
              : result.error.issues[0]?.message || "Hata",
          }));
        } else {
          setErrors((prev) => ({ ...prev, [filter.key]: "" }));
        }
      }

      setLocalValues((prev) => ({ ...prev, [filter.key]: processedValue }));
    },
    []
  );

  if (!serverFilters) return null;

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
    params.delete("skipCount");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const handleReset = () => {
    const initial: Record<string, FilterValue> = {};
    serverFilters.forEach((f) => {
      if (f.type === "array" || f.type === "string-array") {
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

  return (
    <FieldSet className="p-2">
      <ScrollArea className="pr-4">
        <ScrollBar />
        <FieldGroup className={"gap-3 max-h-80"}>
          {serverFilters.map((filter) => {
            if (filter.when === false) return null;
            return (
              <FilterValueEditor
                key={filter.key}
                filter={filter}
                value={localValues[filter.key] as ServerFilterValue | undefined}
                locale={locale}
                error={errors[filter.key]}
                resetSignal={resetCount}
                onChange={(next) => onValueChange(filter, next as FilterValue)}
                onCommit={
                  filter.type === "string" || filter.type === "number"
                    ? handleApply
                    : undefined
                }
              />
            );
          })}
        </FieldGroup>
      </ScrollArea>
      <Field orientation="horizontal" className="justify-center">
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
