import type { JSONSchemaProperty, MasterDataGridResources } from "../types";
import { getTranslations } from "./translation-utils";

/** The first validation message for a cell value, or null when it is valid. */
export type CellValidator = (value: unknown) => string | null;

// zod 4.1's email and uuid patterns, copied so inline-edit validation is
// unchanged now that zod no longer ships with every grid.
const EMAIL =
  /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/;
const UUID =
  /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;

function isUrl(value: string): boolean {
  try {
    new URL(value.trim());
    return true;
  } catch {
    return false;
  }
}

function bound(
  template: string | undefined,
  placeholder: string,
  limit: number,
  fallback: string
): string {
  return template ? template.replace(placeholder, String(limit)) : fallback;
}

function typeCheck(
  property: JSONSchemaProperty,
  t?: MasterDataGridResources
): CellValidator {
  if (property.enum && Array.isArray(property.enum)) {
    const allowed: unknown[] = property.enum;
    const message = t?.["validation.invalidEnum"] || "Invalid value";
    return (value) => (allowed.includes(value) ? null : message);
  }

  switch (property.type) {
    case "string": {
      if (property.format === "uri" || property.format === "url") {
        const message = t?.["validation.invalidUrl"] || "Must be a valid URL";
        return (value) =>
          typeof value === "string" && isUrl(value) ? null : message;
      }
      if (property.format === "uuid") {
        const message = t?.["validation.invalidUuid"] || "Must be a valid UUID";
        return (value) =>
          typeof value === "string" && UUID.test(value) ? null : message;
      }
      const { minLength, maxLength, format } = property;
      return (value) => {
        if (typeof value !== "string")
          return getTranslations("validation.invalidString", t);
        if (minLength !== undefined && value.length < minLength)
          return bound(
            t?.["validation.minLength"],
            "{min}",
            minLength,
            `Must be at least ${minLength} characters`
          );
        if (maxLength !== undefined && value.length > maxLength)
          return bound(
            t?.["validation.maxLength"],
            "{max}",
            maxLength,
            `Must be at most ${maxLength} characters`
          );
        if (format === "email" && !EMAIL.test(value))
          return t?.["validation.invalidEmail"] || "Must be a valid email address";
        return null;
      };
    }

    case "number":
    case "integer": {
      const integer = property.type === "integer";
      const { minimum, maximum } = property;
      return (value) => {
        if (typeof value !== "number" || !Number.isFinite(value))
          return integer
            ? t?.["validation.invalidInteger"] || "Must be a valid integer"
            : t?.["validation.invalidNumber"] || "Must be a valid number";
        if (integer && !Number.isSafeInteger(value))
          return t?.["validation.mustBeInteger"] || "Must be an integer";
        if (minimum !== undefined && value < minimum)
          return bound(
            t?.["validation.minValue"],
            "{min}",
            minimum,
            `Must be at least ${minimum}`
          );
        if (maximum !== undefined && value > maximum)
          return bound(
            t?.["validation.maxValue"],
            "{max}",
            maximum,
            `Must be at most ${maximum}`
          );
        return null;
      };
    }

    case "boolean": {
      const message = t?.["validation.invalidBoolean"] || "Must be true or false";
      return (value) => (typeof value === "boolean" ? null : message);
    }

    default:
      return () => null;
  }
}

/**
 * Validates an inline-edited cell against its column's JSON schema, with the
 * rules and messages the grid's former zod schema produced.
 */
export function createCellValidator(
  property?: JSONSchemaProperty,
  t?: MasterDataGridResources
): CellValidator {
  if (!property) return () => null;
  const check = typeCheck(property, t);
  if (property.required) return check;
  return (value) => (value === null || value === undefined ? null : check(value));
}
