import Form, { ThemeProps } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { Fragment, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ScrollArea from '../../molecules/scroll-area';
import { AsyncSelect, CustomPhoneField, FieldErrorTemplate } from './fields';
import {
  AccordionArrayFieldTemplate,
  ErrorListTemplate,
  FieldTemplate,
  ObjectFieldTemplate,
} from './templates';
import { SchemaFormProps } from './types';
import {
  createSchemaWithFilters,
  flattenGenericData,
  generateFormData,
  generateUiSchema,
  hasPhoneFields,
  mergeUISchemaObjects,
  transformGenericSchema,
} from './utils';
import {
  Combobox,
  CustomCheckbox,
  CustomDate,
  CustomSelect,
  CustomSwitch,
  CustomTextInput,
  PasswordInputWidget,
} from './widgets';

export * from './fields';
export * from './templates';
export * from './types';
export * from './utils';
export * from './widgets';

const ShadcnTheme: ThemeProps = {
  fields: {
    phone: CustomPhoneField,
  },
  widgets: {
    switch: CustomSwitch,
    CheckboxWidget: CustomCheckbox,
    combobox: Combobox,
    SelectWidget: CustomSelect,
    'async-select': AsyncSelect,
    TextWidget: CustomTextInput,
    DateTimeWidget: CustomDate,
    password: PasswordInputWidget,
  },
  templates: {
    ArrayFieldTemplate: AccordionArrayFieldTemplate,
    ErrorListTemplate,
    FieldErrorTemplate,
    FieldTemplate,
    ObjectFieldTemplate,
  },
};

/**
 * SchemaForm component that renders a form based on the provided schema and options.
 * Extends the Form component from @rjsf/core.
 *
 * @param {SchemaFormProps} props - The props for the SchemaForm component.
 * @returns {JSX.Element} - The rendered form component.
 */
export function SchemaForm({ ...props }: SchemaFormProps) {
  const { usePhoneField, filter, children, withScrollArea } = props; // Start with the provided schema
  const Wrapper = withScrollArea ? ScrollArea : Fragment;
  const phoneFieldsConfig = {
    fields: ['areaCode', 'ituCountryCode', 'localNumber'],
    requireds: ['areaCode', 'ituCountryCode', 'localNumber'],
    name: 'phone',
  };
  let uiSchema = {}; // Initialize the UI schema
  let { schema } = props;
  let statedForm = props.formData;
  // If the phone field is enabled, transform the schema and generate UI schema
  if (usePhoneField) {
    schema = transformGenericSchema(
      schema,
      phoneFieldsConfig.fields, // Fields to transform
      phoneFieldsConfig.name, // The parent field name
      phoneFieldsConfig.requireds // Required fields
    );
    uiSchema = generateUiSchema(schema, phoneFieldsConfig.name, {
      'ui:field': phoneFieldsConfig.name, // Specify the field type for UI
    });
    if (hasPhoneFields(statedForm)) {
      statedForm = generateFormData(
        props.formData,
        phoneFieldsConfig.fields, // Fields to transform
        phoneFieldsConfig.name // The parent field name
      );
    }
  }
  if (filter) {
    schema = createSchemaWithFilters({
      filter,
      schema,
    });
  }
  // Merge any additional UI schema provided via props
  if (props.uiSchema) {
    uiSchema = mergeUISchemaObjects(uiSchema, props.uiSchema);
  }
  const [formData] = useState<any>(statedForm);
  return (
    <Wrapper className="h-full">
      <Form
        noHtml5Validate
        liveValidate
        focusOnFirstError
        showErrorList={props.showErrorList || false}
        {...props}
        className={cn('p-px', props.className)}
        formData={formData}
        schema={schema as RJSFSchema} // Cast schema to RJSFSchema type
        validator={validator} // Custom validator
        fields={{ ...ShadcnTheme.fields, ...props.fields }} // Merge custom fields
        widgets={{ ...ShadcnTheme.widgets, ...props.widgets }} // Merge custom widgets
        templates={{ ...ShadcnTheme.templates, ...props.templates }} // Merge custom templates
        uiSchema={uiSchema} // Set the generated UI schema
        onChange={(e) => {
          // Handle form data change
          if (props.usePhoneField) {
            e.formData = flattenGenericData(e.formData, 'phone', [
              'areaCode',
              'ituCountryCode',
              'localNumber',
            ]);
          }
          if (props.onChange) props.onChange(e); // Call the onChange prop if provided
        }}
        onSubmit={(_data, event) => {
          const data = _data;
          // Handle form submission
          if (props.usePhoneField) {
            data.formData = flattenGenericData(data.formData, 'phone', [
              'areaCode',
              'ituCountryCode',
              'localNumber',
            ]);
          }
          if (props.onSubmit) props.onSubmit(data, event); // Call the onSubmit prop if provided
        }}
      >
        {!children && (
          <div className="py-4 sticky bottom-0 bg-white flex justify-end z-50">
            <Button type="submit">{props.submit}</Button>
          </div>
        )}
      </Form>
    </Wrapper>
  );
}
