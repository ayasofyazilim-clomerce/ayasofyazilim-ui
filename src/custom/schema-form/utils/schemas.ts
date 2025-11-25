import { GenericObjectType } from "@rjsf/utils";
import {
  CreateFieldConfigWithResourceProps,
  FilteredObject,
  FilterType,
  UiSchema,
} from "../types";
import { lodash } from "@repo/ayasofyazilim-ui/lib/utils";

/**
 *
 */
export function bulkCreateUiSchema<T>({
  elements,
  config,
}: {
  config: UiSchema<T>;
  elements: Array<keyof T>;
}): UiSchema<T> {
  const uiSchema = {};
  for (const element of elements) {
    Object.assign(uiSchema, { [element]: config });
  }
  return filterUndefinedAndEmpty(uiSchema);
}

/**
 * Creates a UiSchema with internationalization resources and optional overrides.
 */
export function createUiSchemaWithResource<T = unknown>({
  resources,
  schema,
  extend,
  name = "Form",
}: CreateFieldConfigWithResourceProps): UiSchema<T> {
  const baseUiSchema = uiSchemaFromSchema({
    object: schema,
    resources,
    name,
    constantKey: name,
  });

  const targetSchema = lodash.get(baseUiSchema, name, {});

  if (extend) {
    // Lodash merge handles deep merging recursively and safely
    return lodash.merge({}, targetSchema, extend);
  }

  return targetSchema;
}

/**
 * Filters a JSON Schema based on include/exclude/fullExclude rules.
 */
export function createSchemaWithFilters<T = string>({
  schema,
  filter,
}: {
  filter: FilterType<T>;
  schema: GenericObjectType;
}): GenericObjectType {
  const { keys, type } = filter;
  // Deep clone first to avoid mutating the original schema reference
  const modifiedSchema = lodash.cloneDeep(schema);

  const isWildCard = (key: string) => lodash.some(keys, (k) => k === `*${key}`);
  const hasKey = (key: string) => lodash.includes(keys, key);

  const filterRecursive = (
    currentObj: GenericObjectType,
    parentPath: string = ""
  ): void => {
    if (!currentObj.properties && !currentObj.items) return;

    // Handle Properties
    if (currentObj.properties) {
      const keptKeys: string[] = [];

      currentObj.properties = lodash.transform(
        currentObj.properties,
        (result, property, key) => {
          const propertyKey = String(key);
          const currentPath = parentPath
            ? `${parentPath}.${propertyKey}`
            : propertyKey;

          let shouldKeep = false;

          switch (type) {
            case "include":
              // Keep if explicitly included or if it's a wildcard match
              shouldKeep = hasKey(currentPath) || isWildCard(currentPath);
              break;
            case "exclude":
            case "fullExclude":
              // Keep if NOT in the exclude list
              shouldKeep = !hasKey(currentPath);
              break;
          }

          if (shouldKeep) {
            result[propertyKey] = property;
            keptKeys.push(propertyKey);

            // Recursive step for Objects and Arrays
            if (property.type === "object") {
              filterRecursive(property, currentPath);
            } else if (property.type === "array" && property.items) {
              filterRecursive(property.items, currentPath);
            }
          }
        },
        {} as GenericObjectType["properties"]
      );

      // Update or Remove 'required' array based on kept keys
      if (currentObj.required) {
        currentObj.required = lodash.intersection(
          currentObj.required,
          keptKeys
        );
        if (lodash.isEmpty(currentObj.required)) {
          delete currentObj.required;
        }
      }
    }
  };

  filterRecursive(modifiedSchema);
  return modifiedSchema;
}

/**
 * Recursively removes specific keys from any object or array.
 */
export function removeFieldsfromGenericSchema<T>(
  obj: T,
  keysToRemove: string | string[]
): T {
  const keysArray = lodash.castArray(keysToRemove);

  const transform = (value: unknown): unknown => {
    if (lodash.isArray(value)) {
      return lodash.map(value, transform);
    }

    if (lodash.isPlainObject(value)) {
      return lodash.transform(
        value as Record<string, unknown>,
        (result, val, key) => {
          if (!keysArray.includes(key)) {
            result[key] = transform(val);
          }
        },
        {} as Record<string, unknown>
      );
    }

    return value;
  };

  return transform(obj) as T;
}

/**
 * Merges two UISchema objects recursively.
 */

export function mergeUISchemaObjects<
  T extends UiSchema<T> | UiSchema,
  U extends UiSchema<T> | UiSchema,
>(source: T, target: U): T & U {
  // We pass {} as the first argument to ensure we create a new object
  // rather than mutating 'source'.
  return lodash.merge({}, source, target) as T & U;
}

/**
 * Helper: Generates UiSchema structure from JSON Schema + Resources
 */
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
  const uiSchema: Record<string, any> = { [name]: {} };

  // 1. Handle Objects
  if (object?.type === "object" && object.properties) {
    lodash.forEach(object.properties, (propValue, propKey) => {
      const nestedSchema = uiSchemaFromSchema({
        name: propKey,
        object: propValue,
        resources,
        constantKey: `${constantKey}.${propKey}`,
      });

      // Merge nested results into the current name scope
      Object.assign(uiSchema[name], {
        "ui:title": resources[constantKey],
        ...nestedSchema,
      });
    });
  }

  // 2. Handle Arrays
  else if (object?.type === "array" && object.items?.properties) {
    const items = lodash.reduce(
      object.items.properties,
      (acc, propValue, propKey) => {
        const nested = uiSchemaFromSchema({
          name: propKey,
          object: propValue,
          resources,
          constantKey: `${constantKey}.${propKey}`,
        });
        return lodash.merge(acc, nested);
      },
      {}
    );

    Object.assign(uiSchema[name], {
      "ui:title": resources[constantKey] || lodash.startCase(name),
      items,
    });
  }

  // 3. Handle Primitives (Plain fields)
  else if (object) {
    const getResource = (suffix?: string) =>
      resources[suffix ? `${constantKey}.${suffix}` : constantKey];

    const uiSchemaItem: Record<string, any> = {
      "ui:title": getResource() || lodash.startCase(name),
      "ui:placeholder": getResource("ui:placeholder"),
    };

    if (object.enum) {
      uiSchemaItem["ui:enumNames"] = object.enum.map(
        (key: string) => resources[`${constantKey}.${key}`] || key
      );
      uiSchemaItem["ui:options"] = {
        label: true,
        emptyValue: getResource("emptyValue"),
        searchPlaceholder: getResource("searchPlaceholder"),
        searchResultLabel: getResource("searchResultLabel"),
      };
    }

    Object.assign(uiSchema[name], uiSchemaItem);
  }

  return filterUndefinedAndEmpty(uiSchema);
}

/**
 * Recursively filters out undefined values and empty objects/arrays
 */
function filterUndefinedAndEmpty<T>(obj: T): FilteredObject<T> {
  if (!lodash.isObject(obj)) {
    return obj as FilteredObject<T>;
  }

  // Use omitBy to filter undefined, then mapValues to recurse
  const result = lodash.transform(
    obj as unknown as object,
    (acc: any, value, key) => {
      const filteredValue = filterUndefinedAndEmpty(value);

      const isValid =
        filteredValue !== undefined &&
        !(lodash.isPlainObject(filteredValue) && lodash.isEmpty(filteredValue));

      if (isValid) {
        acc[key] = filteredValue;
      }
    },
    {}
  );

  return result as FilteredObject<T>;
}
