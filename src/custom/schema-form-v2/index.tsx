"use client";

import { lodash } from "@repo/ayasofyazilim-ui/lib/utils";
import { Form } from "@rjsf/shadcn";
import { GenericObjectType } from "@rjsf/utils";
import { customizeValidator } from "@rjsf/validator-ajv8";
import { useMemo } from "react";
import {
  ArrayFieldItemTemplate,
  ArrayFieldTemplate,
  BaseInputTemplate,
  FieldTemplate,
  ObjectFieldTemplate,
} from "./fields";
import { SubmitButton } from "./templates";
import { FilterType, RJSFFormProps, UiSchema } from "./types";
import {
  createSchemaWithFilters,
  removeFieldsfromGenericSchema,
} from "./utils";
import {
  CheckboxWidget,
  DateTimeWidget,
  DateWidget,
  EmailInputWidget,
  PasswordInputWidget,
  PhoneWithParseWidget,
  PhoneWithValueWidget,
  SwitchWidget,
  SelectWidget,
} from "./widgets";
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
};

const INTERNAL_TEMPLATES = {
  ObjectFieldTemplate,
  BaseInputTemplate,
  FieldTemplate,
  ButtonTemplates: { SubmitButton },
};

const FIELDS_TO_REMOVE = ["extraProperties", "additionalProperties"];

export function SchemaForm<T = any>(
  props: Omit<RJSFFormProps<T>, "schema" | "uiSchema"> & {
    filter?: FilterType<T>;
    schema: GenericObjectType;
    uiSchema?: UiSchema;
    useTableForArrayFields?: boolean;
  }
) {
  const {
    validator: customValidator,
    schema: originalSchema,
    widgets,
    fields,
    templates,
    filter,
    useTableForArrayFields = false,
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
    if (filter) {
      schema = createSchemaWithFilters({
        filter,
        schema,
      });
    }
    return removeFieldsfromGenericSchema(schema, FIELDS_TO_REMOVE);
  }, [originalSchema, filter]);
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
  }, [templates]);

  return (
    <Form
      {...restProps}
      formContext={{
        useTableForArrayFields,
      }}
      schema={processedSchema}
      validator={validatorToUse}
      widgets={memoizedWidgets}
      fields={memoizedFields}
      templates={memoizedTemplates}
      noHtml5Validate={restProps.noHtml5Validate ?? true}
      showErrorList={restProps.showErrorList ?? false}
    />
  );
}
