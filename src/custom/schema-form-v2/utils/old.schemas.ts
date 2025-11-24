import { GenericObjectType } from "@rjsf/utils";
import {
  CreateFieldConfigWithResourceProps,
  FilteredObject,
  UiSchema,
} from "../types";

export function createUiSchemaWithResource<T = unknown>({
  resources,
  schema,
  extend,
  name = "Form",
}: CreateFieldConfigWithResourceProps): UiSchema<T> {
  const uiSchema = uiSchemaFromSchema({
    object: schema,
    resources,
    name,
    constantKey: name,
  });
  if (extend) {
    return mergeUISchemaObjects(uiSchema[name] || {}, extend);
  }
  return uiSchema[name] || {};
}

const isObject = (value: any): value is GenericObjectType =>
  value && typeof value === "object" && !Array.isArray(value);

function uiSchemaFromSchema({
  name,
  object,
  resources,
  constantKey,
}: {
  constantKey: string;
  name: string;
  object: GenericObjectType;
  resources: Record<string, string>;
}) {
  const uiSchema = {
    [name]: {},
  };
  // object
  if (object && object.type === "object" && object.properties) {
    for (const property of Object.keys(object.properties)) {
      Object.assign(uiSchema[name] || {}, {
        "ui:title": resources[constantKey],
        ...uiSchemaFromSchema({
          name: property,
          object: object.properties[property],
          resources,
          constantKey: `${constantKey}.${property}`,
        }),
      });
    }
  }
  // array
  else if (
    object &&
    object.type === "array" &&
    object.items &&
    object.items.properties
  ) {
    const items = {};
    for (const property of Object.keys(object.items.properties)) {
      Object.assign(
        items,
        uiSchemaFromSchema({
          name: property,
          object: object.items.properties[property],
          resources,
          constantKey: `${constantKey}.${property}`,
        })
      );
    }
    Object.assign(uiSchema[name] || {}, {
      "ui:title": resources[constantKey] || beautifyLabel(name),
      items,
    });
  }
  // plain
  else if (object) {
    const getResourceValue = (name: string) =>
      resources[`${constantKey}.${name}`] || undefined;
    const uiSchemaItem = {
      "ui:title": resources[constantKey] || beautifyLabel(name),
      "ui:placeholder": getResourceValue("ui:placeholder"),
    };
    // enum varsa
    if (Object.keys(object).includes("enum")) {
      const labels = object.enum.map(
        (key: string) => getResourceValue(key) || key
      );
      Object.assign(uiSchemaItem, {
        "ui:enumNames": labels,
        "ui:options": {
          label: true,
          emptyValue: getResourceValue("emptyValue"),
          searchPlaceholder: getResourceValue("searchPlaceholder"),
          searchResultLabel: getResourceValue("searchResultLabel"),
        },
      });
    }

    Object.assign(uiSchema[name] || {}, uiSchemaItem);
  }
  return filterUndefinedAndEmpty(uiSchema);
}

function mergeUISchemaObjects<T extends UiSchema<T>, U extends UiSchema<T>>(
  source: T,
  target: U
): T & U {
  const mergedResult: UiSchema<T> = { ...source }; // Copy the source UISchema object
  for (const key of Object.keys(target)) {
    // If both keys are objects, merge them recursively
    if (isObject(mergedResult[key]) && isObject(target[key])) {
      mergedResult[key] = mergeUISchemaObjects(mergedResult[key], target[key]);
    } else {
      // If there is no conflict or the value is not an object, take the value from the target
      mergedResult[key] = target[key];
    }
  }

  return mergedResult as T & U; // Return the merged result
}

function beautifyLabel(input: string | undefined | null): string {
  if (!input || typeof input !== "string") return ""; // Handle null, undefined, or non-string inputs
  return input
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Handle camelCase
    .replace(/[-_]/g, " ") // Replace underscores and hyphens with spaces
    .split(/\s+/) // Split by spaces
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
    .join(" ");
}

function filterUndefinedAndEmpty<T>(obj: T): FilteredObject<T> {
  if (typeof obj !== "object" || obj === null) {
    return obj as FilteredObject<T>;
  }

  const filtered: Partial<FilteredObject<T>> = {};

  for (const [key, value] of Object.entries(obj)) {
    const filteredValue = filterUndefinedAndEmpty(value);
    // Check if the value is not undefined and not an empty object
    if (
      filteredValue !== undefined &&
      !(
        typeof filteredValue === "object" &&
        Object.keys(filteredValue).length === 0
      )
    ) {
      Object.assign(filtered, { [key]: filteredValue });
    }
  }

  return filtered as FilteredObject<T>;
}
