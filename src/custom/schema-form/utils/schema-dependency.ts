import { FormValidation, GenericObjectType, RJSFValidationError } from "@rjsf/utils";

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
  path: string
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
  dependencies: DependencyConfig
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
                (r) => r !== hiddenTarget
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
                targetField
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
              visibleFieldsUnique.includes(r)
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

// ============================================================================
// RUNTIME CONDITIONAL REQUIREMENTS
// ============================================================================
// For fields that need runtime validation (e.g., UUID comparisons, complex conditions)
// Use this when JSON Schema dependencies can't express the condition.

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

type EmptyCheckFn = (value: unknown) => boolean;

interface ConditionalFieldConfig {
  /** Fields that trigger the requirement check when filled */
  triggerFields: string[];
  /** Fields that become required when trigger condition is met */
  requiredFields: string[];
  /** Optional custom empty check per field (default: checks empty string, null, undefined, EMPTY_GUID) */
  emptyChecks?: Record<string, EmptyCheckFn>;
  /** Error message for required fields (default: "Required") */
  errorMessage?: string;
  /** Minimum number of trigger fields that must be filled to activate requirements (default: 2) */
  minFilledCount?: number;
  /** If true, remove this object from form data on submit when requirements are not triggered */
  removeFromSubmit?: boolean;
}

interface RuntimeDependencyConfig {
  /** Path to the nested object (e.g., "address", "telephone") */
  [objectPath: string]: ConditionalFieldConfig;
}

/**
 * Default check for whether a value is considered "empty"
 */
function isValueEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") {
    return value.trim() === "" || value === EMPTY_GUID;
  }
  return false;
}

/**
 * Get a nested value from an object using dot notation path
 */
function getNestedValue(obj: GenericObjectType, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as GenericObjectType)[part];
  }
  return current;
}

/**
 * Creates a modified schema where specified nested object fields are not required.
 * The required fields will be validated at runtime instead.
 */
function applyRuntimeDependencies<T extends GenericObjectType>(
  originalSchema: T,
  config: RuntimeDependencyConfig
): T {
  const schema = JSON.parse(JSON.stringify(originalSchema)) as T;
  const schemaAsJson = schema as unknown as JSONSchema;

  for (const [objectPath, fieldConfig] of Object.entries(config)) {
    const nestedSchema = getNestedProperty(schemaAsJson, objectPath);
    if (nestedSchema) {
      // Remove all conditionally required fields from the nested object's required array
      const fieldsToMakeOptional = [
        ...fieldConfig.triggerFields,
        ...fieldConfig.requiredFields,
      ];
      if (nestedSchema.required) {
        nestedSchema.required = nestedSchema.required.filter(
          (field) => !fieldsToMakeOptional.includes(field)
        );
      }
    }
  }

  // Also remove the nested object itself from root required if all its fields are optional
  if (schemaAsJson.required) {
    for (const objectPath of Object.keys(config)) {
      const topLevelField = objectPath.split(".")[0];
      if (topLevelField && schemaAsJson.required.includes(topLevelField)) {
        schemaAsJson.required = schemaAsJson.required.filter(
          (field: string) => field !== topLevelField
        );
      }
    }
  }

  return schema;
}

/**
 * Creates a customValidate function for runtime conditional requirements.
 * 
 * Logic: If ANY trigger field is filled, ALL required fields become required.
 * 
 * @example
 * // Address validation: if countryId filled AND any other field filled, all required
 * const validateAddress = createRuntimeValidator({
 *   address: {
 *     triggerFields: ["countryId", "adminAreaLevel1Id", "adminAreaLevel2Id", "addressLine"],
 *     requiredFields: ["countryId", "adminAreaLevel1Id", "adminAreaLevel2Id", "addressLine", "type"],
 *   }
 * });
 */
function createRuntimeValidator<TData extends GenericObjectType>(
  config: RuntimeDependencyConfig
) {
  return function validate(
    formData: TData | undefined,
    errors: FormValidation<TData>
  ): FormValidation<TData> {
    if (!formData) return errors;

    for (const [objectPath, fieldConfig] of Object.entries(config)) {
      const nestedObject = getNestedValue(formData, objectPath) as
        | GenericObjectType
        | undefined;
      if (!nestedObject) continue;

      const errorMessage = fieldConfig.errorMessage || "Required";

      // Check if any trigger field is filled
      const filledTriggerFields = fieldConfig.triggerFields.filter((field) => {
        const value = nestedObject[field];
        const emptyCheck = fieldConfig.emptyChecks?.[field] || isValueEmpty;
        return !emptyCheck(value);
      });

      // If at least 2 trigger fields are filled (not just one), all required fields become required
      // This handles the "only countryId filled = optional" case
      if (filledTriggerFields.length >= 2) {
        const nestedErrors = getNestedValue(
          errors as unknown as GenericObjectType,
          objectPath
        ) as GenericObjectType | undefined;

        for (const requiredField of fieldConfig.requiredFields) {
          const value = nestedObject[requiredField];
          const emptyCheck =
            fieldConfig.emptyChecks?.[requiredField] || isValueEmpty;

          if (emptyCheck(value)) {
            const fieldError = nestedErrors?.[requiredField] as
              | { addError?: (msg: string) => void }
              | undefined;
            fieldError?.addError?.(errorMessage);
          }
        }
      }
    }

    return errors;
  };
}

/**
 * Convenience function that applies both schema modifications and returns a validator.
 * Use this for the complete solution.
 * 
 * @typeParam TSchema - The schema object type
 * @typeParam TData - The form data type (optional, defaults to GenericObjectType)
 */
function createConditionalRequirements<
  TSchema extends GenericObjectType,
  TData extends GenericObjectType = GenericObjectType,
>(
  originalSchema: TSchema,
  config: RuntimeDependencyConfig
): {
  schema: TSchema;
  validate: (
    formData: TData | undefined,
    errors: FormValidation<TData>
  ) => FormValidation<TData>;
} {
  return {
    schema: applyRuntimeDependencies(originalSchema, config),
    validate: createRuntimeValidator<TData>(config),
  };
}

/**
 * Checks if requirements should be active for a given object path.
 * Returns true if 2+ trigger fields are filled.
 */
function shouldRequireFields<TData extends GenericObjectType>(
  formData: TData | undefined,
  objectPath: string,
  fieldConfig: ConditionalFieldConfig
): boolean {
  if (!formData) return false;

  const nestedObject = getNestedValue(formData, objectPath) as
    | GenericObjectType
    | undefined;
  if (!nestedObject) return false;

  const filledTriggerFields = fieldConfig.triggerFields.filter((field) => {
    const value = nestedObject[field];
    const emptyCheck = fieldConfig.emptyChecks?.[field] || isValueEmpty;
    return !emptyCheck(value);
  });

  const minCount = fieldConfig.minFilledCount ?? 2;
  return filledTriggerFields.length >= minCount;
}

/**
 * Creates a schema with required fields dynamically based on current form state.
 * Use this in useMemo to recompute schema when form data changes.
 * 
 * @param originalSchema - The original schema
 * @param config - The runtime dependency configuration
 * @param formData - Current form data to determine required state
 * @returns Schema with correct required fields based on form state
 */
function createDynamicSchema<
  TSchema extends GenericObjectType,
  TData extends GenericObjectType = GenericObjectType,
>(
  originalSchema: TSchema,
  config: RuntimeDependencyConfig,
  formData: TData | undefined
): TSchema {
  const schema = JSON.parse(JSON.stringify(originalSchema)) as TSchema;
  const schemaAsJson = schema as unknown as JSONSchema;

  for (const [objectPath, fieldConfig] of Object.entries(config)) {
    const nestedSchema = getNestedProperty(schemaAsJson, objectPath);
    if (!nestedSchema) continue;

    const requirementsActive = shouldRequireFields(
      formData,
      objectPath,
      fieldConfig
    );

    if (requirementsActive) {
      // Add required fields to the nested object's required array
      const currentRequired = nestedSchema.required || [];
      const newRequired = new Set([
        ...currentRequired,
        ...fieldConfig.requiredFields,
      ]);
      nestedSchema.required = Array.from(newRequired);
    } else {
      // Remove conditionally required fields from required array
      const fieldsToMakeOptional = [
        ...fieldConfig.triggerFields,
        ...fieldConfig.requiredFields,
      ];
      if (nestedSchema.required) {
        nestedSchema.required = nestedSchema.required.filter(
          (field) => !fieldsToMakeOptional.includes(field)
        );
      }
    }
  }

  // Handle top-level required for nested objects
  if (schemaAsJson.required) {
    for (const [objectPath, fieldConfig] of Object.entries(config)) {
      const topLevelField = objectPath.split(".")[0];
      if (!topLevelField) continue;

      const requirementsActive = shouldRequireFields(
        formData,
        objectPath,
        fieldConfig
      );

      if (requirementsActive) {
        // Add to required if not already present
        if (!schemaAsJson.required.includes(topLevelField)) {
          schemaAsJson.required.push(topLevelField);
        }
      } else {
        // Remove from required
        schemaAsJson.required = schemaAsJson.required.filter(
          (field: string) => field !== topLevelField
        );
      }
    }
  }

  return schema;
}

/**
 * Creates a transformErrors function that filters out format validation errors
 * when the field value is empty. This prevents errors like "must match email format"
 * when an optional email field is empty.
 *
 * @param formData - Current form data to check for empty values
 * @returns TransformErrors function for SchemaForm
 */
function createEmptyValueTransformErrors<TData extends GenericObjectType>(
  formData: TData | undefined
) {
  return function transformErrors(
    errors: RJSFValidationError[]
  ): RJSFValidationError[] {
    return errors.filter((error) => {
      // Only filter format errors
      if (error.name !== "format") return true;

      // Get the field path from the property (e.g., ".email.emailAddress" -> ["email", "emailAddress"])
      const path = (error.property || "")
        .replace(/^\./, "")
        .split(".")
        .filter(Boolean);

      if (path.length === 0 || !formData) return true;

      // Navigate to get the value
      let value: unknown = formData;
      for (const key of path) {
        if (value && typeof value === "object" && key in value) {
          value = (value as Record<string, unknown>)[key];
        } else {
          return true; // Path doesn't exist, keep the error
        }
      }

      // If value is empty, filter out the format error
      return !isValueEmpty(value);
    });
  };
}

/**
 * Cleans form data for submission by removing objects where requirements are not triggered
 * and removeFromSubmit is true.
 *
 * @param formData - The form data to clean
 * @param config - The runtime dependency configuration
 * @returns Cleaned form data ready for submission
 */
function cleanFormDataForSubmit<TData extends GenericObjectType>(
  formData: TData,
  config: RuntimeDependencyConfig
): Partial<TData> {
  const result = { ...formData } as Record<string, unknown>;

  for (const [objectPath, fieldConfig] of Object.entries(config)) {
    if (!fieldConfig.removeFromSubmit) continue;

    // Check if requirements are triggered
    const requirementsActive = shouldRequireFields(formData, objectPath, fieldConfig);

    // If requirements are NOT active and removeFromSubmit is true, remove the object
    if (!requirementsActive) {
      // Handle nested paths (e.g., "contact.address")
      const pathParts = objectPath.split(".");
      if (pathParts.length === 1) {
        delete result[objectPath];
      } else {
        // Navigate to parent and delete the leaf
        let current: Record<string, unknown> = result;
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i] as string;
          if (current[part] && typeof current[part] === "object") {
            current = current[part] as Record<string, unknown>;
          } else {
            break;
          }
        }
        const leafKey = pathParts[pathParts.length - 1] as string;
        delete current[leafKey];
      }
    }
  }

  return result as Partial<TData>;
}

export {
  applyRuntimeDependencies,
  createRuntimeValidator,
  createConditionalRequirements,
  createDynamicSchema,
  createEmptyValueTransformErrors,
  cleanFormDataForSubmit,
  shouldRequireFields,
  isValueEmpty,
  EMPTY_GUID,
};
export type { RuntimeDependencyConfig, ConditionalFieldConfig };
