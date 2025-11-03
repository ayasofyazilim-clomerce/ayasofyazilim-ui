"use client";

import { FilterIcon } from "lucide-react";
import {
  Dispatch,
  JSX,
  ReactNode,
  SetStateAction,
  useState,
  useTransition,
} from "react";
import { Button } from "@repo/ayasofyazilim-ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@repo/ayasofyazilim-ui/components/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ayasofyazilim-ui/components/collapsible";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import AsyncSelectField from "./fields/async-select";
import DateField from "./fields/date";
import MultiSelectField from "./fields/multi-select";

export type FilterComponentSearchItem = { id: string; name: string };
export type DateSelectType = {
  title: string;
  id: string;
  placeholder?: string;
  onChange: Dispatch<SetStateAction<string>>;
  value: string;
  options: {
    label: string;
    value: string;
  }[];
  order?: number;
};

export type MultiSelectType = {
  title: string;
  value: string[];
  options: { label: string; value: string }[];
  onChange: Dispatch<SetStateAction<string[]>>;
  order?: number;
  placeholder?: string;
  selectAllLabel?: string;
  id: string;
};
export type AsyncSelectType = {
  id: string;
  title: string;
  fetchAction: (search: string) => Promise<FilterComponentSearchItem[]>;
  onChange: Dispatch<SetStateAction<FilterComponentSearchItem[]>>;
  value: FilterComponentSearchItem[];
  multiple?: boolean;
  order?: number;
};
export type CustomFieldType = { order?: number; component: JSX.Element };

function isAsyncSelectType(
  filter: DateSelectType | MultiSelectType | AsyncSelectType | CustomFieldType,
): filter is AsyncSelectType {
  return (filter as AsyncSelectType).fetchAction !== undefined;
}

function isMultiSelectType(
  filter: DateSelectType | MultiSelectType | AsyncSelectType | CustomFieldType,
): filter is MultiSelectType {
  return (
    (filter as MultiSelectType).options !== undefined &&
    Array.isArray((filter as MultiSelectType).value)
  );
}

function isDateSelectType(
  filter: DateSelectType | MultiSelectType | AsyncSelectType | CustomFieldType,
): filter is DateSelectType {
  return (
    (filter as DateSelectType).options !== undefined &&
    typeof (filter as DateSelectType).value === "string"
  );
}

export default function FilterComponent({
  dateSelect,
  multiSelect,
  asyncSelect,
  onSubmit,
  filtersText = "Filters",
  searchText = "Search",
  applyFilterText = "Apply",
  className,
  cardClassName,
  defaultOpen = true,
  customField,
  disabled = false,
  isCollapsible = true,
  filterGuidanceContent,
}: {
  dateSelect: DateSelectType[];
  multiSelect: MultiSelectType[];
  asyncSelect: AsyncSelectType[];
  onSubmit: () => void;
  filtersText?: string;
  applyFilterText?: string;
  searchText?: string;
  className?: string;
  cardClassName?: string;
  defaultOpen?: boolean;
  disabled?: boolean;
  customField?: CustomFieldType[];
  isCollapsible?: boolean;
  filterGuidanceContent?: ReactNode;
}) {
  const fields = [
    ...dateSelect,
    ...multiSelect,
    ...asyncSelect,
    ...(customField || []),
  ].sort((a, b) => (a.order || 0) - (b.order || 0));

  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  function handleSubmit() {
    startTransition(() => {
      onSubmit();
    });
  }
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("w-full space-y-2", className)}
    >
      {isCollapsible && (
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="icon" disabled={!isCollapsible}>
            <FilterIcon className="h-4 w-4" />
            <span className="sr-only">Filters</span>
          </Button>
        </CollapsibleTrigger>
      )}
      <CollapsibleContent className="space-y-2">
        <Card
          className={cn(
            "shadow-none",
            !filterGuidanceContent && "mx-auto",
            cardClassName,
          )}
        >
          <CardHeader className="flex flex-row font-bold text-xl items-center justify-between">
            {filtersText}
          </CardHeader>
          <CardContent className="flex flex-row gap-3 items-start">
            {filterGuidanceContent && (
              <div className="w-1/2 text-sm text-muted-foreground">
                {filterGuidanceContent}
              </div>
            )}

            <div
              className={cn(
                "flex flex-col gap-4",
                filterGuidanceContent ? "w-1/2" : "w-full",
              )}
            >
              {fields.map((filter, index) => {
                if (isAsyncSelectType(filter)) {
                  return (
                    <AsyncSelectField
                      key={filter.id}
                      filter={filter}
                      isPending={isPending || disabled}
                      searchText={searchText}
                    />
                  );
                }
                if (isMultiSelectType(filter)) {
                  return (
                    <MultiSelectField
                      key={filter.id}
                      filter={filter}
                      isPending={isPending || disabled}
                    />
                  );
                }
                if (isDateSelectType(filter)) {
                  return (
                    <DateField
                      key={filter.id}
                      filter={filter}
                      isPending={isPending || disabled}
                    />
                  );
                }
                return (
                  <div key={`c${index.toString()}`}>{filter.component}</div>
                );
              })}

              <Button
                disabled={isPending || disabled}
                onClick={() => handleSubmit()}
                variant="default"
              >
                {applyFilterText}
              </Button>
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
