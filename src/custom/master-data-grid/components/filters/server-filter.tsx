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
import { clearFiltersFromParams } from "../../utils/server-filter-url";
import {
  readFilterValues,
  type ServerFilterValue,
} from "../../utils/server-filter-utils";
import {
  isPrefixUrlState,
  scopedKey,
  urlPrefixOf,
} from "../../utils/url-scope";
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
  const { locale, urlState, onServerFiltersChange } = config;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const { serverFilters } = config;
  // Prefix mode reads and writes `<prefix>.<key>`; "none" mode starts empty,
  // reports through onServerFiltersChange and never pushes.
  const isLocal = urlState === "none";
  const prefix = urlPrefixOf(urlState);

  const [resetCount, setResetCount] = useState(0);

  const [localValues, setLocalValues] = useState<Record<string, FilterValue>>(
    () => {
      const initial: Record<string, FilterValue> = {};
      const source = isLocal ? new URLSearchParams() : searchParams;
      serverFilters?.forEach((filter) => {
        const key = scopedKey(filter.key, prefix);
        const val = source.get(key);
        if (filter.type === "array" || filter.type === "string-array") {
          initial[filter.key] = source.getAll(key);
        } else if (filter.type === "boolean") {
          initial[filter.key] =
            val === "true" ? true : val === "false" ? false : undefined;
        } else if (filter.type === "number") {
          initial[filter.key] = val ? Number(val) : undefined;
        } else if (filter.type === "date-range") {
          initial[filter.key] = {
            from: source.get(scopedKey(filter.keyFrom, prefix)) || undefined,
            to: source.get(scopedKey(filter.keyTo, prefix)) || undefined,
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
    // "none" mode builds the same params from nothing, only to read them back.
    const params = new URLSearchParams(isLocal ? "" : searchParams.toString());
    let hasValidationError = false;

    serverFilters.forEach((filter) => {
      const val = localValues[filter.key];

      if (filter.type === "date-range") {
        const keyFrom = scopedKey(filter.keyFrom, prefix);
        const keyTo = scopedKey(filter.keyTo, prefix);
        params.delete(keyFrom);
        params.delete(keyTo);
        const rangeVal = val as DateRangeValue | undefined;
        if (rangeVal?.from) params.set(keyFrom, rangeVal.from);
        if (rangeVal?.to) params.set(keyTo, rangeVal.to);
        return;
      }

      const key = scopedKey(filter.key, prefix);
      params.delete(key);
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
          val.forEach((v) => params.append(key, String(v)));
        } else {
          params.set(key, String(val));
        }
      } else {
        setErrors((prev) => ({ ...prev, [filter.key]: "" }));
      }
    });
    if (hasValidationError) return;
    params.delete(scopedKey("skipCount", prefix));
    if (isLocal) {
      onServerFiltersChange?.(readFilterValues(serverFilters, params));
      return;
    }
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
    if (isLocal) {
      onServerFiltersChange?.({});
      return;
    }
    if (isPrefixUrlState(urlState)) {
      // Clear only this grid's filters and page; other grids keep theirs.
      const next = clearFiltersFromParams(
        new URLSearchParams(searchParams.toString()),
        serverFilters,
        prefix
      ).toString();
      startTransition(() =>
        router.push(next ? `${pathname}?${next}` : pathname, { scroll: false })
      );
      return;
    }
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
