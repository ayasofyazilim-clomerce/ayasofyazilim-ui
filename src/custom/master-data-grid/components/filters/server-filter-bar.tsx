"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, X } from "lucide-react";
import { useCallback, useMemo, useState, useTransition } from "react";
import { Button } from "../../../../components/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../../../components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../components/popover";
import { cn } from "../../../../lib/utils";
import type { MasterDataGridConfig, ServerFilterConfig } from "../../types";
import {
  applyFilterToParams,
  clearFiltersFromParams,
} from "../../utils/server-filter-url";
import {
  formatFilterValue,
  readFilterValue,
  visibleFilters,
  type ServerFilterValue,
} from "../../utils/server-filter-utils";
import { getTranslations } from "../../utils/translation-utils";
import { FilterValueEditor } from "./filter-value-editor";

export interface ServerFilterBarProps<TData> {
  config: MasterDataGridConfig<TData>;
}

const BATCH_ON_CLOSE_TYPES = new Set<ServerFilterConfig["type"]>([
  "array",
  "string-array",
  "date-range",
]);

function normalizedParams(
  params: URLSearchParams,
  exclude: string[] = []
): string {
  return [...params.entries()]
    .filter(([key]) => !exclude.includes(key))
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join("&");
}

export function ServerFilterBar<TData>({
  config,
}: ServerFilterBarProps<TData>) {
  const { t, localization } = config;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, ServerFilterValue | undefined>
  >({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filters = useMemo(
    () => visibleFilters(config.serverFilters),
    [config.serverFilters]
  );

  const params = useMemo(
    () => new URLSearchParams(searchParams?.toString() ?? ""),
    [searchParams]
  );

  const applied = useMemo(
    () =>
      filters
        .map((filter) => ({
          filter,
          value: readFilterValue(filter, params),
        }))
        .filter(
          (entry) => entry.value !== undefined || entry.filter.key in drafts
        ),
    [filters, params, drafts]
  );

  const pushParams = useCallback(
    (next: URLSearchParams) => {
      const query = next.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router]
  );

  const commit = useCallback(
    (filter: ServerFilterConfig, value: ServerFilterValue | undefined) => {
      if (filter.validator && value !== undefined && value !== "") {
        const result = filter.validator.safeParse(value);
        if (!result.success) {
          setErrors((prev) => ({
            ...prev,
            [filter.key]: result.error.issues[0]?.message ?? "",
          }));
          return;
        }
      }
      setErrors((prev) => ({ ...prev, [filter.key]: "" }));
      setDrafts((prev) => {
        const nextDrafts = { ...prev };
        delete nextDrafts[filter.key];
        return nextDrafts;
      });
      setOpenKey(null);

      const next = applyFilterToParams(params, filter, value);
      if (
        normalizedParams(next, ["skipCount"]) ===
        normalizedParams(params, ["skipCount"])
      ) {
        return;
      }
      pushParams(next);
    },
    [params, pushParams]
  );

  const remove = useCallback(
    (filter: ServerFilterConfig) => {
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[filter.key];
        return next;
      });
      setErrors((prev) => ({ ...prev, [filter.key]: "" }));
      setOpenKey(null);
      pushParams(applyFilterToParams(params, filter, undefined));
    },
    [params, pushParams]
  );

  if (!filters.length) return null;

  const unset = filters.filter(
    (filter) =>
      readFilterValue(filter, params) === undefined && !(filter.key in drafts)
  );
  const hasApplied = filters.some(
    (filter) => readFilterValue(filter, params) !== undefined
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {applied.map(({ filter, value }) => {
        const draft = filter.key in drafts ? drafts[filter.key] : value;
        const text =
          value === undefined
            ? ""
            : formatFilterValue(filter, value, localization);
        return (
          <Popover
            key={filter.key}
            open={openKey === filter.key}
            onOpenChange={(open) => {
              if (open) {
                setOpenKey(filter.key);
                return;
              }
              if (BATCH_ON_CLOSE_TYPES.has(filter.type) && filter.key in drafts) {
                commit(filter, drafts[filter.key]);
                return;
              }
              setOpenKey(null);
            }}
          >
            <div className="inline-flex h-7 items-stretch overflow-hidden rounded-full border bg-secondary text-xs">
              <PopoverTrigger asChild>
                <button
                  type="button"
                  data-testid={`server-filter-chip-${filter.key}`}
                  className="inline-flex min-w-0 items-center gap-1.5 px-2.5 hover:bg-muted"
                >
                  <span className="text-muted-foreground">
                    {filter.label}
                  </span>
                  <span
                    className={cn(
                      "max-w-[24ch] truncate font-semibold",
                      !text && "font-normal text-muted-foreground"
                    )}
                  >
                    {text || filter.placeholder}
                  </span>
                </button>
              </PopoverTrigger>
              <button
                type="button"
                data-testid={`server-filter-remove-${filter.key}`}
                aria-label={filter.label}
                className="border-l px-1.5 text-muted-foreground hover:bg-destructive hover:text-white"
                onClick={() => remove(filter)}
              >
                <X className="size-3" />
              </button>
            </div>
            <PopoverContent align="start" className="w-72">
              <FilterValueEditor
                filter={filter}
                value={draft}
                locale={localization?.locale}
                error={errors[filter.key]}
                commitOnBlur
                onChange={(next) =>
                  setDrafts((prev) => ({ ...prev, [filter.key]: next }))
                }
                onCommit={
                  BATCH_ON_CLOSE_TYPES.has(filter.type)
                    ? undefined
                    : (next) => commit(filter, next)
                }
              />
            </PopoverContent>
          </Popover>
        );
      })}

      <Popover open={paletteOpen} onOpenChange={setPaletteOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-testid="server-filter-add"
            className="h-7 border-dashed text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-3" />
            {getTranslations("filter.addFilter", t)}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-64 p-0"
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <Command>
            <CommandInput
              placeholder={getTranslations("filter.selectColumn", t)}
            />
            <CommandList>
              <CommandEmpty>
                {getTranslations("filter.selectColumn", t)}
              </CommandEmpty>
              {unset.map((filter) => (
                <CommandItem
                  key={filter.key}
                  value={filter.label}
                  data-testid={`server-filter-option-${filter.key}`}
                  onSelect={() => {
                    setPaletteOpen(false);
                    setDrafts((prev) => ({
                      ...prev,
                      [filter.key]: undefined,
                    }));
                    setOpenKey(filter.key);
                  }}
                >
                  {filter.label}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {hasApplied && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          data-testid="server-filter-reset"
          className="ml-auto h-7 text-xs text-muted-foreground"
          onClick={() => {
            setDrafts({});
            setErrors({});
            setOpenKey(null);
            pushParams(clearFiltersFromParams(params, filters));
          }}
        >
          {getTranslations("filter.resetFilters", t)}
        </Button>
      )}
    </div>
  );
}
