import { GenericObjectType } from "@rjsf/utils";

interface JSONSchema {
  type?: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  dependencies?: Record<string, JSONSchemaDependency>;
  items?: JSONSchema | JSONSchema[];
  additionalItems?: JSONSchema;
  definitions?: Record<string, JSONSchema>;
  $ref?: string;
  title?: string;
  description?: string;
  enum?: unknown[];
  default?: unknown;
  oneOf?: JSONSchema[];
  nullable?: boolean;
  format?: string;
  [key: string]: unknown;
}

interface JSONSchemaDependency {
  properties?: Record<string, JSONSchema>;
  required?: string[];
  oneOf?: JSONSchema[];
}

interface FieldDependencyRule {
  when: (value: unknown) => boolean;
  targets: string[];
  fieldCondition?: JSONSchema;
}

interface FieldDependencies {
  HIDES?: FieldDependencyRule[];
  REQUIRES?: FieldDependencyRule[];
}

type DependencyConfig = Record<string, FieldDependencies>;

/**
 * Helper to safely get a nested property in a JSON Schema using dot notation path.
 */
function getNestedProperty(
  obj: JSONSchema,
  path: string,
): JSONSchema | undefined {
  const parts = path.split(".");
  let current: JSONSchema | undefined = obj;

  for (const part of parts) {
    if (!current?.properties?.[part]) return undefined;
    current = current.properties[part];
  }
  return current;
}

/**
 * Get all possible values for a controlling field to create conditional branches.
 */
function getFieldValues(schema: JSONSchema, fieldPath: string): unknown[] {
  const field = getNestedProperty(schema, fieldPath);
  if (!field) return [];
  if (field.enum) return field.enum;
  if (field.type === "boolean") return [true, false];
  if (field.type === "integer" || field.type === "number")
    return ["__NUMERIC_RANGE__"];
  return [];
}

/**
 * Main function to apply HIDES and REQUIRES field dependencies on a JSON Schema.
 */
function applyFieldDependencies(
  originalSchema: GenericObjectType,
  dependencies: DependencyConfig,
): JSONSchema {
  const schema: JSONSchema = JSON.parse(JSON.stringify(originalSchema));
  if (!schema.properties) return schema;

  for (const [fieldPath, fieldDeps] of Object.entries(dependencies)) {
    const fieldValues = getFieldValues(schema, fieldPath);
    if (fieldValues.length > 0) {
      const parentPath = fieldPath.split(".").slice(0, -1).join(".");
      const parentSchema = parentPath
        ? getNestedProperty(schema, parentPath)
        : schema;
      const fieldName = fieldPath.split(".").pop()!;

      if (parentSchema) {
        // Collect all HIDES targets globally, to remove from root properties
        const allHidesTargets = new Set<string>();
        if (fieldDeps.HIDES) {
          for (const rule of fieldDeps.HIDES) {
            rule.targets.forEach((t) => allHidesTargets.add(t));
          }
        }

        // Remove all HIDES targets from root properties immediately
        for (const hiddenTarget of Array.from(allHidesTargets)) {
          if (schema.properties[hiddenTarget]) {
            delete schema.properties[hiddenTarget];
            if (schema.required?.includes(hiddenTarget)) {
              schema.required = schema.required.filter(
                (r) => r !== hiddenTarget,
              );
            }
          }
        }

        const conditionalSchemas: JSONSchema[] = [];

        for (const value of fieldValues) {
          const requiredFields: string[] = [];
          const visibleFields: string[] = [];

          if (fieldDeps.REQUIRES) {
            for (const rule of fieldDeps.REQUIRES) {
              if (rule.when(value)) {
                requiredFields.push(...rule.targets);
                visibleFields.push(...rule.targets);
              }
            }
          }

          if (fieldDeps.HIDES) {
            for (const rule of fieldDeps.HIDES) {
              if (rule.when(value)) {
                // Hidden fields: do NOT add to visibleFields
                // But fields not hidden should be visible
                // So we skip these targets here
              } else {
                // For other values where fields are not hidden, add them visible
                visibleFields.push(...rule.targets);
              }
            }
          }

          // Also add controlling field itself visible
          visibleFields.push(fieldName);

          // Deduplicate visibleFields
          const visibleFieldsUnique = Array.from(new Set(visibleFields));

          // Build properties for conditional schema
          const conditionalProperties: Record<string, JSONSchema> = {};

          visibleFieldsUnique.forEach((targetField) => {
            // If targetField === fieldName, add enum with current value
            if (targetField === fieldName) {
              conditionalProperties[targetField] = {
                enum: [value],
              };
            } else {
              // Else get original schema for that target field
              const originalFieldSchema = getNestedProperty(
                originalSchema,
                targetField,
              );
              if (originalFieldSchema) {
                conditionalProperties[targetField] = { ...originalFieldSchema };
              }
            }
          });

          const conditionalSchema: JSONSchema = {
            properties: conditionalProperties,
          };

          if (requiredFields.length > 0) {
            conditionalSchema.required = requiredFields.filter((r) =>
              visibleFieldsUnique.includes(r),
            );
          }

          conditionalSchemas.push(conditionalSchema);
        }

        if (!parentSchema.dependencies) parentSchema.dependencies = {};
        parentSchema.dependencies[fieldName] = { oneOf: conditionalSchemas };
      }
    }
  }

  return schema;
}

export { applyFieldDependencies };
export type {
  JSONSchema,
  DependencyConfig,
  FieldDependencies,
  FieldDependencyRule,
};
