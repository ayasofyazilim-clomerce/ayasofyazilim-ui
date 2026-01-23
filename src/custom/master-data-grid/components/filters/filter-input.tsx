import { useMemo } from "react";
import { ArrowRight, X } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../../../../components/input-group";
import { Input } from "../../../../components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/select";
import { Slider } from "../../../../components/slider";
import type { FilterOperator, ColumnMeta, MasterDataGridResources } from "../../types";
import { getTranslations } from "../../utils/translation-utils";

interface FilterInputProps {
  operator: FilterOperator;
  value: string;
  value2?: string;
  columnMeta?: ColumnMeta;
  onValueChange: (value: string) => void;
  onValue2Change?: (value: string) => void;
  onSliderChange?: (values: number[]) => void;
  onClear: () => void;
  t?: MasterDataGridResources;
  variant?: "inline" | "popover";
}

/**
 * Centralized filter input component
 * Handles different input types: text, number, boolean, range, etc.
 */
export function FilterInput({
  operator,
  value,
  value2 = "",
  columnMeta,
  onValueChange,
  onValue2Change,
  onSliderChange,
  onClear,
  t,
  variant = "popover",
}: FilterInputProps) {
  const schemaProperty = columnMeta?.schemaProperty;

  const isRangeOperator = operator === "between" || operator === "inRange";
  const needsNoInput = operator === "isEmpty" || operator === "isNotEmpty";
  const isNumberType =
    schemaProperty?.type === "number" || schemaProperty?.type === "integer";
  const isBooleanType = schemaProperty?.type === "boolean";
  const showSlider = isRangeOperator && isNumberType;

  // Calculate min/max for slider from schema or data
  const sliderMin = useMemo(
    () => schemaProperty?.minimum ?? 0,
    [schemaProperty?.minimum]
  );
  const sliderMax = useMemo(
    () => schemaProperty?.maximum ?? 100,
    [schemaProperty?.maximum]
  );

  const inputType = isNumberType ? "number" : "text";

  // No input needed for isEmpty/isNotEmpty
  if (needsNoInput) {
    return null;
  }

  // Boolean type - use select dropdown
  if (isBooleanType && !isRangeOperator) {
    if (variant === "inline") {
      return (
        <InputGroup>
          <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder={getTranslations("filter.value", t)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">
                {getTranslations("filter.true", t)}
              </SelectItem>
              <SelectItem value="false">
                {getTranslations("filter.false", t)}
              </SelectItem>
            </SelectContent>
          </Select>
          {value && (
            <InputGroupButton
              size="icon-xs"
              onClick={onClear}
              aria-label={getTranslations("filter.clearFilter", t)}
            >
              <X />
            </InputGroupButton>
          )}
        </InputGroup>
      );
    }

    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="flex-1 min-w-0">
          <SelectValue placeholder={getTranslations("filter.value", t)} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">
            {getTranslations("filter.true", t)}
          </SelectItem>
          <SelectItem value="false">
            {getTranslations("filter.false", t)}
          </SelectItem>
        </SelectContent>
      </Select>
    );
  }

  // Range operators - two inputs with optional slider
  if (isRangeOperator && onValue2Change) {
    if (variant === "inline") {
      return (
        <div className="space-y-3">
          <InputGroup className="rounded-none border-0 shadow-none">
            <InputGroupInput
              value={value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onValueChange(e.target.value)
              }
              placeholder={getTranslations("filter.min", t)}
              type={inputType}
              className="text-sm rounded-none"
            />
            <span className="text-xs text-muted-foreground px-1">&</span>
            <InputGroupInput
              value={value2}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onValue2Change(e.target.value)
              }
              placeholder={getTranslations("filter.max", t)}
              type={inputType}
              className="text-sm rounded-none"
            />
            {(value || value2) && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  onClick={onClear}
                  aria-label={getTranslations("filter.clearFilter", t)}
                >
                  <X />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>

          {showSlider && onSliderChange && (
            <div className="space-y-2">
              <Slider
                min={sliderMin}
                max={sliderMax}
                step={1}
                value={[
                  Number(value) || sliderMin,
                  Number(value2) || sliderMax,
                ]}
                onValueChange={onSliderChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs font-medium text-foreground">
                <span className="px-2 py-0.5 rounded bg-muted">
                  {value || sliderMin}
                </span>
                <span className="px-2 py-0.5 rounded bg-muted">
                  {value2 || sliderMax}
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Popover variant - separate inputs
    return (
      <InputGroup className="flex-1 min-w-0">
        <InputGroupInput
          placeholder={getTranslations("filter.min", t)}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onValueChange(e.target.value)
          }
          type={inputType}
          className="flex-1 min-w-0 text-sm rounded-none"
        />
        <span className="text-muted-foreground px-0.5 sm:px-1">
          <ArrowRight className="h-3 w-3 sm:hidden" />
          <span className="hidden sm:inline text-xs">
            {getTranslations("filter.to", t)}
          </span>
        </span>
        <InputGroupInput
          placeholder={getTranslations("filter.max", t)}
          value={value2}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onValue2Change(e.target.value)
          }
          type={inputType}
          className="flex-1 min-w-0 text-sm rounded-none"
        />
        {(value || value2) && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              onClick={onClear}
              aria-label={getTranslations("filter.clearFilter", t)}
            >
              <X />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
    );
  }

  // Single value input
  if (variant === "inline") {
    return (
      <InputGroup className="rounded-none">
        <InputGroupInput
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onValueChange(e.target.value)
          }
          placeholder={getTranslations("filter.value", t)}
          type={inputType}
          className="rounded-none"
        />
        {value && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              onClick={onClear}
              aria-label={getTranslations("filter.clearFilter", t)}
            >
              <X />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
    );
  }

  return (
    <Input
      placeholder={getTranslations("filter.value", t)}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      type={inputType}
      className="flex-1 min-w-0 text-sm rounded-none"
    />
  );
}
