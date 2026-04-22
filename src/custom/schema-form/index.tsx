"use client";

import { lodash } from "@repo/ayasofyazilim-ui/lib/utils";
import { Form } from "@rjsf/shadcn";
import { customizeValidator } from "@rjsf/validator-ajv8";
import type { RJSFValidationError, FormValidation } from "@rjsf/utils";
import { useCallback, useMemo } from "react";
import {
  ArrayFieldItemTemplate,
  ArrayFieldTemplate,
  BaseInputTemplate,
  FieldTemplate,
  ObjectFieldTemplate,
} from "./fields";
import { DescriptionFieldTemplate, SubmitButton } from "./templates";
import { SchemaFormProps } from "./types";
import {
  createSchemaWithFilters,
  removeFieldsfromGenericSchema,
  isValueEmpty,
  cleanFormDataForSubmit,
  cleanHiddenFieldsFromFormData,
  createRuntimeValidator,
  createDynamicSchema,
  applyFieldDependencies,
} from "./utils";
import {
  CheckboxWidget,
  DateTimeWidget,
  DateWidget,
  EmailInputWidget,
  PasswordInputWidget,
  PhoneWithParseWidget,
  PhoneWithValueWidget,
  SelectWidget,
  SwitchWidget,
  URLInputWidget,
} from "./widgets";

export * from "./custom";
export * from "./types";
export * from "./utils";
export * from "./widgets";

const INTERNAL_WIDGETS = {
  switch: SwitchWidget,
  checkbox: CheckboxWidget,
  date: DateWidget,
  "date-time": DateTimeWidget,
  email: EmailInputWidget,
  password: PasswordInputWidget,
  phone: PhoneWithValueWidget,
  "phone-with-parse": PhoneWithParseWidget,
  select: SelectWidget,
  url: URLInputWidget,
};

const INTERNAL_TEMPLATES = {
  ObjectFieldTemplate,
  BaseInputTemplate,
  FieldTemplate,
  DescriptionFieldTemplate,
  ButtonTemplates: { SubmitButton },
};

const FIELDS_TO_REMOVE = ["extraProperties", "additionalProperties"];

export function SchemaForm<T = unknown>(props: SchemaFormProps<T>) {
  const {
    validator: customValidator,
    schema: originalSchema,
    widgets,
    fields,
    templates,
    filter,
    useTableForArrayFields = false,
    formData,
    transformErrors: userTransformErrors,
    runtimeDependencyConfig,
    fieldDependencies,
    onSubmit: userOnSubmit,
    customValidate: userCustomValidate,
    ...restProps
  } = props;

  const validatorToUse = useMemo(() => {
    if (customValidator) return customValidator;

    return customizeValidator({
      ajvOptionsOverrides: {
        removeAdditional: true,
      },
    });
  }, [customValidator]);

  const processedSchema = useMemo(() => {
    let schema = originalSchema;

    if (fieldDependencies) {
      schema = applyFieldDependencies(schema, fieldDependencies);
    }

    if (runtimeDependencyConfig && formData) {
      schema = createDynamicSchema(
        schema,
        runtimeDependencyConfig,
        formData as Record<string, unknown>
      );
    }

    if (filter) {
      schema = createSchemaWithFilters({
        filter,
        schema,
      });
    }
    return removeFieldsfromGenericSchema(schema, FIELDS_TO_REMOVE);
  }, [
    originalSchema,
    filter,
    runtimeDependencyConfig,
    formData,
    fieldDependencies,
  ]);

  const transformErrors = useCallback(
    (errors: RJSFValidationError[]): RJSFValidationError[] => {
      const errorsToFilterWhenEmpty = ["format", "minLength", "pattern"];

      let filteredErrors = errors.filter((error) => {
        if (!error.name || !errorsToFilterWhenEmpty.includes(error.name))
          return true;

        const path = (error.property || "")
          .replace(/^\./, "")
          .split(".")
          .filter(Boolean);

        if (path.length === 0 || !formData) return true;

        let value: unknown = formData;
        for (const key of path) {
          if (value && typeof value === "object" && key in value) {
            value = (value as Record<string, unknown>)[key];
          } else {
            return true;
          }
        }

        return !isValueEmpty(value);
      });

      if (userTransformErrors) {
        filteredErrors = userTransformErrors(filteredErrors, {});
      }

      return filteredErrors;
    },
    [formData, userTransformErrors]
  );

  const combinedCustomValidate = useCallback(
    (formDataToValidate: T, errors: FormValidation<T>): FormValidation<T> => {
      let validationErrors = errors;

      if (runtimeDependencyConfig) {
        const runtimeValidator = createRuntimeValidator(
          runtimeDependencyConfig
        );
        validationErrors = runtimeValidator(
          formDataToValidate as Record<string, unknown>,
          validationErrors as FormValidation<Record<string, unknown>>
        ) as FormValidation<T>;
      }

      if (userCustomValidate) {
        validationErrors = userCustomValidate(
          formDataToValidate,
          validationErrors
        );
      }

      return validationErrors;
    },
    [runtimeDependencyConfig, userCustomValidate]
  );

  const memoizedWidgets = useMemo(
    () => lodash.merge(INTERNAL_WIDGETS, widgets),
    [widgets]
  );
  const memoizedFields = useMemo(() => fields, [fields]);
  const memoizedTemplates = useMemo(() => {
    return lodash.merge(
      INTERNAL_TEMPLATES,
      templates,
      useTableForArrayFields
        ? { ArrayFieldItemTemplate, ArrayFieldTemplate }
        : {}
    );
  }, [templates, useTableForArrayFields]);

  const handleSubmit = useCallback(
    (
      data: Parameters<NonNullable<typeof userOnSubmit>>[0],
      event: React.FormEvent<HTMLFormElement>
    ) => {
      if (!userOnSubmit) return;

      let submitData = data;
      let cleanedFormData = data.formData as T;

      if (fieldDependencies && cleanedFormData) {
        cleanedFormData = cleanHiddenFieldsFromFormData(
          cleanedFormData as Record<string, unknown>,
          fieldDependencies
        ) as T;
      }

      if (runtimeDependencyConfig && cleanedFormData) {
        cleanedFormData = cleanFormDataForSubmit(
          cleanedFormData as Record<string, unknown>,
          runtimeDependencyConfig
        ) as T;
      }

      if (fieldDependencies || runtimeDependencyConfig) {
        submitData = { ...data, formData: cleanedFormData };
      }

      userOnSubmit(submitData, event);
    },
    [userOnSubmit, runtimeDependencyConfig, fieldDependencies]
  );

  return (
    <Form
      {...restProps}
      customValidate={
        runtimeDependencyConfig || userCustomValidate
          ? combinedCustomValidate
          : undefined
      }
      formContext={{
        useTableForArrayFields,
      }}
      formData={formData}
      onSubmit={handleSubmit}
      schema={processedSchema}
      transformErrors={transformErrors}
      validator={validatorToUse}
      widgets={memoizedWidgets}
      fields={memoizedFields}
      templates={memoizedTemplates}
      noHtml5Validate={restProps.noHtml5Validate ?? true}
      showErrorList={restProps.showErrorList ?? false}
    />
  );
}
