import type { FilterFn } from "@tanstack/react-table";
import type { FilterOperator } from "../types";

function getRowValue(row: unknown, columnId: string): unknown {
  if (!row || typeof row !== "object") return undefined;

  const keys = columnId.split(".");
  let value: unknown = row;

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return value;
}

function toString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  if (value instanceof Date) return value.getTime();
  return NaN;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export const masterFilter: FilterFn<unknown> = (row, columnId, filterValue) => {
  if (!filterValue || typeof filterValue !== "object") return true;

  const { operator, value, value2 } = filterValue as {
    operator: FilterOperator;
    value: unknown;
    value2?: unknown;
  };

  const cellValue = getRowValue(row.original, columnId);

  switch (operator) {
    case "equals":
      return (
        toString(cellValue).toLowerCase() === toString(value).toLowerCase()
      );

    case "notEquals":
      return (
        toString(cellValue).toLowerCase() !== toString(value).toLowerCase()
      );

    case "contains":
      return toString(cellValue)
        .toLowerCase()
        .includes(toString(value).toLowerCase());

    case "notContains":
      return !toString(cellValue)
        .toLowerCase()
        .includes(toString(value).toLowerCase());

    case "startsWith":
      return toString(cellValue)
        .toLowerCase()
        .startsWith(toString(value).toLowerCase());

    case "endsWith":
      return toString(cellValue)
        .toLowerCase()
        .endsWith(toString(value).toLowerCase());

    case "isEmpty":
      return !cellValue || toString(cellValue).trim() === "";

    case "isNotEmpty":
      return Boolean(cellValue) && toString(cellValue).trim() !== "";

    case "greaterThan": {
      const numValue = toNumber(cellValue);
      const numFilter = toNumber(value);
      return !isNaN(numValue) && !isNaN(numFilter) && numValue > numFilter;
    }

    case "greaterThanOrEqual": {
      const numValue = toNumber(cellValue);
      const numFilter = toNumber(value);
      return !isNaN(numValue) && !isNaN(numFilter) && numValue >= numFilter;
    }

    case "lessThan": {
      const numValue = toNumber(cellValue);
      const numFilter = toNumber(value);
      return !isNaN(numValue) && !isNaN(numFilter) && numValue < numFilter;
    }

    case "lessThanOrEqual": {
      const numValue = toNumber(cellValue);
      const numFilter = toNumber(value);
      return !isNaN(numValue) && !isNaN(numFilter) && numValue <= numFilter;
    }

    case "between": {
      const numValue = toNumber(cellValue);
      const numMin = toNumber(value);
      const numMax = toNumber(value2);
      return (
        !isNaN(numValue) &&
        !isNaN(numMin) &&
        !isNaN(numMax) &&
        numValue >= numMin &&
        numValue <= numMax
      );
    }

    case "inRange": {
      const numValue = toNumber(cellValue);
      const numMin = toNumber(value);
      const numMax = toNumber(value2);
      return (
        !isNaN(numValue) &&
        !isNaN(numMin) &&
        !isNaN(numMax) &&
        numValue >= numMin &&
        numValue <= numMax
      );
    }

    case "before": {
      const dateValue = toDate(cellValue);
      const dateFilter = toDate(value);
      return (
        dateValue !== null && dateFilter !== null && dateValue < dateFilter
      );
    }

    case "after": {
      const dateValue = toDate(cellValue);
      const dateFilter = toDate(value);
      return (
        dateValue !== null && dateFilter !== null && dateValue > dateFilter
      );
    }

    case "inList": {
      if (!Array.isArray(value)) return false;
      const strValue = toString(cellValue).toLowerCase();
      return value.some((v) => toString(v).toLowerCase() === strValue);
    }

    case "notInList": {
      if (!Array.isArray(value)) return true;
      const strValue = toString(cellValue).toLowerCase();
      return !value.some((v) => toString(v).toLowerCase() === strValue);
    }

    default:
      return true;
  }
};

export function getFilterOperators(
  type?: string,
  format?: string
): FilterOperator[] {
  if (format === "date" || format === "date-time" || format === "time") {
    return [
      "equals",
      "notEquals",
      "before",
      "after",
      "between",
      "isEmpty",
      "isNotEmpty",
    ];
  }

  if (type === "number" || type === "integer") {
    return [
      "equals",
      "notEquals",
      "greaterThan",
      "greaterThanOrEqual",
      "lessThan",
      "lessThanOrEqual",
      "between",
      "inRange",
      "isEmpty",
      "isNotEmpty",
    ];
  }

  if (type === "boolean") {
    return ["equals", "notEquals", "isEmpty", "isNotEmpty"];
  }

  if (format === "enum") {
    return [
      "equals",
      "notEquals",
      "inList",
      "notInList",
      "isEmpty",
      "isNotEmpty",
    ];
  }

  return [
    "equals",
    "notEquals",
    "contains",
    "notContains",
    "startsWith",
    "endsWith",
    "isEmpty",
    "isNotEmpty",
  ];
}

export function validateFilterValue(
  operator: FilterOperator,
  value: unknown,
  value2?: unknown
): boolean {
  if (operator === "isEmpty" || operator === "isNotEmpty") {
    return true;
  }

  if (operator === "between" || operator === "inRange") {
    return (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value2 !== undefined &&
      value2 !== null &&
      value2 !== ""
    );
  }

  if (operator === "inList" || operator === "notInList") {
    return Array.isArray(value) && value.length > 0;
  }

  return value !== undefined && value !== null && value !== "";
}

export function formatFilterValue(
  value: unknown,
  operator: FilterOperator,
  schemaType?: string,
  schemaFormat?: string
): string {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    return value.map((v) => toString(v)).join(", ");
  }

  if (schemaFormat === "date" || schemaFormat === "date-time") {
    const date = toDate(value);
    if (date) {
      return schemaFormat === "date"
        ? date.toLocaleDateString()
        : date.toLocaleString();
    }
  }

  if (schemaType === "number" || schemaType === "integer") {
    const num = toNumber(value);
    return isNaN(num) ? toString(value) : num.toString();
  }

  return toString(value);
}
