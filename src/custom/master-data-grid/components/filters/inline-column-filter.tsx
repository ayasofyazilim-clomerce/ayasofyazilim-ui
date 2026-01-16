import type { Column } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/dropdown-menu";
import type { ColumnFilter, FilterOperator, ColumnMeta } from "../../types";
import {
  getFilterOperators,
  validateFilterValue,
} from "../../utils/filter-fns";
import { getTranslations } from "../../utils/translation-utils";
import { FilterInput } from "./filter-input";

interface InlineColumnFilterProps<TData> {
  column: Column<TData, unknown>;
  t?: Record<string, string>;
}

/**
 * Inline filter input that appears directly in the column header
 * More intuitive than dialog-based filtering
 */
export function InlineColumnFilter<TData>({
  column,
  t,
}: InlineColumnFilterProps<TData>) {
  const meta = column.columnDef.meta as ColumnMeta | undefined;
  const schemaProperty = meta?.schemaProperty;
  const filterOperators = meta?.filterOperators;

  const availableOperators = useMemo<FilterOperator[]>(() => {
    return (
      filterOperators ||
      (schemaProperty
        ? getFilterOperators(schemaProperty.type, schemaProperty.format)
        : ["contains"])
    );
  }, [filterOperators, schemaProperty?.type, schemaProperty?.format]);

  const currentFilter = column.getFilterValue() as ColumnFilter | undefined;
  const [operator, setOperator] = useState<FilterOperator>(
    currentFilter?.operator || availableOperators[0] || "contains"
  );
  const [value, setValue] = useState<string>(
    String(currentFilter?.value || "")
  );
  const [value2, setValue2] = useState<string>(
    String(currentFilter?.value2 || "")
  );

  const isRangeOperator = operator === "between" || operator === "inRange";
  const isNumberType =
    schemaProperty?.type === "number" || schemaProperty?.type === "integer";
  const needsNoInput = operator === "isEmpty" || operator === "isNotEmpty";

  const handleValueChange = (newValue: string) => {
    setValue(newValue);

    if (!newValue && !isRangeOperator) {
      column.setFilterValue(undefined);
      return;
    }

    if (isRangeOperator) {
      if (
        newValue &&
        value2 &&
        validateFilterValue(operator, newValue, value2)
      ) {
        const filter: ColumnFilter = {
          id: column.id,
          operator,
          value: newValue,
          value2,
        };
        column.setFilterValue(filter);
      }
    } else if (validateFilterValue(operator, newValue)) {
      const filter: ColumnFilter = {
        id: column.id,
        operator,
        value: newValue,
      };
      column.setFilterValue(filter);
    }
  };

  const handleValue2Change = (newValue2: string) => {
    setValue2(newValue2);

    if (value && newValue2 && validateFilterValue(operator, value, newValue2)) {
      const filter: ColumnFilter = {
        id: column.id,
        operator,
        value,
        value2: newValue2,
      };
      column.setFilterValue(filter);
    }
  };

  const handleSliderChange = (values: number[]) => {
    const [min, max] = values;
    setValue(String(min));
    setValue2(String(max));

    const filter: ColumnFilter = {
      id: column.id,
      operator,
      value: String(min),
      value2: String(max),
    };
    column.setFilterValue(filter);
  };

  const handleClear = () => {
    setValue("");
    setValue2("");
    column.setFilterValue(undefined);
  };

  const handleOperatorChange = (newOperator: FilterOperator) => {
    setOperator(newOperator);

    const isNewRangeOperator =
      newOperator === "between" || newOperator === "inRange";
    const needsNoInputNew =
      newOperator === "isEmpty" || newOperator === "isNotEmpty";

    if (needsNoInputNew) {
      // No value needed for isEmpty/isNotEmpty
      const filter: ColumnFilter = {
        id: column.id,
        operator: newOperator,
        value: "",
      };
      column.setFilterValue(filter);
    } else if (isNewRangeOperator) {
      // Clear filter when switching to range without both values
      if (value && value2 && validateFilterValue(newOperator, value, value2)) {
        const filter: ColumnFilter = {
          id: column.id,
          operator: newOperator,
          value,
          value2,
        };
        column.setFilterValue(filter);
      } else {
        column.setFilterValue(undefined);
      }
    } else {
      // Clear filter when switching from no-input operator without value
      if (value && validateFilterValue(newOperator, value)) {
        const filter: ColumnFilter = {
          id: column.id,
          operator: newOperator,
          value,
        };
        column.setFilterValue(filter);
      } else {
        column.setFilterValue(undefined);
      }
    }
  };

  // Show operator dropdown only if multiple operators available
  const showOperatorSelect = availableOperators.length > 1;

  return (
    <div className="space-y-2">
      {showOperatorSelect && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full px-2 py-1.5 text-xs font-medium hover:bg-accent rounded-md flex items-center justify-between">
              {getTranslations(`filter.operator.${operator}`, t)}{" "}
              <ChevronDown className="size-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {availableOperators.map((op) => (
              <DropdownMenuItem
                key={op}
                onClick={() => handleOperatorChange(op)}
                className="text-xs"
              >
                {getTranslations(`filter.operator.${op}`, t)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <FilterInput
        operator={operator}
        value={value}
        value2={value2}
        columnMeta={meta}
        onValueChange={handleValueChange}
        onValue2Change={handleValue2Change}
        onSliderChange={handleSliderChange}
        onClear={handleClear}
        t={t}
        variant="inline"
      />
    </div>
  );
}
