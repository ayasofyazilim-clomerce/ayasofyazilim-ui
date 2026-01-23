import type { Column } from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/dropdown-menu";
import type {
  ColumnFilter,
  ColumnMeta,
  FilterOperator,
  MasterDataGridResources,
} from "../../types";
import {
  getFilterOperators,
  validateFilterValue,
} from "../../utils/filter-fns";
import { getTranslations } from "../../utils/translation-utils";
import { FilterInput } from "./filter-input";

interface InlineColumnFilterProps<TData> {
  column: Column<TData, unknown>;
  t?: MasterDataGridResources;
}

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
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isRangeOperator = operator === "between" || operator === "inRange";

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleValueChange = useCallback(
    (newValue: string) => {
      setValue(newValue);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
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
      }, 300);
    },
    [column, operator, value2, isRangeOperator]
  );

  const handleValue2Change = useCallback(
    (newValue2: string) => {
      setValue2(newValue2);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        if (
          value &&
          newValue2 &&
          validateFilterValue(operator, value, newValue2)
        ) {
          const filter: ColumnFilter = {
            id: column.id,
            operator,
            value,
            value2: newValue2,
          };
          column.setFilterValue(filter);
        }
      }, 300);
    },
    [column, operator, value]
  );

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
      const filter: ColumnFilter = {
        id: column.id,
        operator: newOperator,
        value: "",
      };
      column.setFilterValue(filter);
    } else if (isNewRangeOperator) {
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
  const showOperatorSelect = availableOperators.length > 1;

  return (
    <div className="space-y-2">
      {showOperatorSelect && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full px-2 py-1.5 text-xs font-medium hover:bg-accent rounded-md flex items-center justify-between">
              {getTranslations(`filter.operator.${operator}`, t)}
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
