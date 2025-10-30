'use client';

import Form from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';
import {
  createRef,
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { cloneDeep, get, set } from 'lodash';
import { Button } from '@repo/ayasofyazilim-ui/components/button';
import { ScrollBar } from '@repo/ayasofyazilim-ui/components/scroll-area';
import { cn } from '@repo/ayasofyazilim-ui/lib/utils';
import { ScrollArea } from '@repo/ayasofyazilim-ui/components/scroll-area';
import { StringArrayItem } from './custom/string-array';
import { FieldErrorTemplate } from './fields';
import {
  AccordionArrayFieldTemplate,
  DescriptionFieldTemplate,
  ErrorListTemplate,
  FieldTemplate,
  ObjectFieldTemplate,
  TableArrayFieldTemplate,
} from './templates';
import { FormContext, SchemaFormProps } from './types';
import {
  createSchemaWithFilters,
  getArrayFieldKeys,
  mergeUISchemaObjects,
  removeFieldsfromGenericSchema,
} from './utils';
import { AJV_TR } from './utils/langugage';
import {
  Combobox,
  CustomCheckbox,
  CustomDate,
  CustomDateWithTime,
  CustomPhoneField,
  CustomPhoneFieldWithParse,
  CustomPhoneFieldWithValue,
  CustomSelect,
  CustomSwitch,
  CustomTextareaInput,
  CustomTextInput,
  EmailInputWidget,
  PasswordInputWidget,
} from './widgets';

const formRef = createRef<any>();
export { FieldLabel } from './custom/label';
/**
 * SchemaForm component that renders a form based on the provided schema and options.
 * Extends the Form component from @rjsf/core.
 *
 * @param {SchemaFormProps} props - The props for the SchemaForm component.
 * @returns {JSX.Element} - The rendered form component.
 */
export function SchemaForm<T = unknown>({ ...props }: SchemaFormProps<T>) {
  const {
    filter,
    children,
    withScrollArea = true,
    useDefaultSubmit = true,
    useDependency = false,
    disableValidation = false,
    defaultSubmitClassName,
    locale = 'en',
    schema: originalSchema,
    uiSchema: propsUiSchema,
    onChange,
    onSubmit,
    widgets: customWidgets,
    fields: customFields,
    templates: customTemplates,
    useTableForArrayItems,
    showErrorList = false,
    className,
    disabled,
    submitText,
    id = 'schema_form',
    formData: propsFormData,
    ...restProps
  } = props;

  const [extraErrors, setExtraErrors] = useState<any>({});
  // Keep track of the current form data for submission
  const currentFormDataRef = useRef<T | undefined>(propsFormData);

  // Internal state only used when useDependency is true
  const [internalFormData, setInternalFormData] = useState<T | undefined>(
    propsFormData
  );

  // Update refs and internal state when props change
  useEffect(() => {
    currentFormDataRef.current = propsFormData;
    if (useDependency) {
      setInternalFormData(propsFormData);
    }
  }, [propsFormData, useDependency]);

  // Memoize array fields calculation
  const arrayFields = useMemo(
    () => getArrayFieldKeys(originalSchema),
    [originalSchema]
  );

  // Memoize default widgets, fields, and templates
  const defaultWidgets = useMemo(
    () => ({
      switch: CustomSwitch,
      CheckboxWidget: CustomCheckbox,
      combobox: Combobox,
      SelectWidget: CustomSelect,
      TextWidget: CustomTextInput,
      TextareaWidget: CustomTextareaInput,
      DateTimeWidget: CustomDate,
      DateWidget: CustomDateWithTime,
      password: PasswordInputWidget,
      email: EmailInputWidget,
      phone: CustomPhoneField,
      'phone-with-parse': CustomPhoneFieldWithParse,
      'phone-with-value': CustomPhoneFieldWithValue,
      StringArray: StringArrayItem,
    }),
    []
  );

  const defaultTemplates = useMemo(
    () => ({
      ArrayFieldTemplate:
        useTableForArrayItems && arrayFields.length > 0
          ? TableArrayFieldTemplate
          : AccordionArrayFieldTemplate,
      ErrorListTemplate,
      FieldErrorTemplate,
      FieldTemplate,
      ObjectFieldTemplate,
      DescriptionFieldTemplate,
    }),
    [useTableForArrayItems, arrayFields.length]
  );

  // Memoize merged widgets, fields, and templates
  const mergedWidgets = useMemo(
    () => ({
      ...defaultWidgets,
      ...customWidgets,
    }),
    [defaultWidgets, customWidgets]
  );

  const mergedFields = useMemo(
    () => ({
      ...customFields,
    }),
    [customFields]
  );

  const mergedTemplates = useMemo(
    () => ({
      ...defaultTemplates,
      ...customTemplates,
    }),
    [defaultTemplates, customTemplates]
  );

  // Memoize schema processing
  const processedSchema = useMemo(() => {
    let schema = originalSchema;
    if (filter) {
      schema = createSchemaWithFilters({
        filter,
        schema,
      });
    }
    return removeFieldsfromGenericSchema(schema, [
      'extraProperties',
    ]) as RJSFSchema;
  }, [originalSchema, filter]);

  // Memoize UI schema processing
  const processedUiSchema = useMemo(() => {
    let uiSchema = {
      'ui:config': {
        locale,
      },
    };

    if (propsUiSchema) {
      // @ts-expect-error --its not falsy
      uiSchema = mergeUISchemaObjects(uiSchema, propsUiSchema);
    }

    return uiSchema;
  }, [locale, propsUiSchema]);

  // Memoize form context
  const formContext = useMemo(
    () => ({
      ...processedUiSchema['ui:config'],
      formData: useDependency
        ? useDependency
          ? internalFormData
          : propsFormData
        : undefined,
      useTableForArrayItems,
      arrayFields,
    }),
    [
      processedUiSchema,
      useDependency,
      internalFormData,
      propsFormData,
      useTableForArrayItems,
      arrayFields,
    ]
  );

  // Memoize validator

  // Determine which formData to use for the form
  const formDataToUse = useMemo(
    () => (useDependency ? internalFormData : propsFormData),
    [useDependency, internalFormData, propsFormData]
  );

  // Memoize wrapper component
  const Wrapper = useMemo(
    () => (withScrollArea ? ScrollArea : Fragment),
    [withScrollArea]
  );

  // Memoize wrapper props
  const wrapperProps = useMemo(
    () => (withScrollArea ? { className: 'h-full [&>div>div]:!block' } : {}),
    [withScrollArea]
  );

  // Optimized change handler
  const handleChange = useCallback(
    (e: any) => {
      // Always update the ref with the latest data
      currentFormDataRef.current = e.formData;

      if (onChange) {
        onChange({ ...e, formData: e.formData });
      }

      // Only update internal state if using dependency
      if (useDependency) {
        setInternalFormData(e.formData);
      }
    },
    [useDependency]
  );
  const handleBlur = useCallback(async (changedField: string) => {
    const { errorSchema: _errorSchema } = formRef.current.validate(
      currentFormDataRef.current
    );

    // changeField is like root_name or root_address_addressLine
    const path = `${changedField.replace('root_', '').replaceAll('_', '.')}.__errors`;
    const formValidationErrors = get(formRef.current.state.errorSchema, path);
    if (formValidationErrors) {
      setExtraErrors({});
      return;
    }
    const errors = get(_errorSchema, path);
    setExtraErrors((prev: any) => {
      const newErrors = cloneDeep(prev);
      if (!errors || errors.length === 0) {
        return set(newErrors, path.replace('.__errors', ''), undefined);
      }
      return set(newErrors, path, errors);
    });
  }, []);

  // Optimized submit handler
  const handleSubmit = useCallback(
    (data: any, event: any) => {
      event.preventDefault();
      setExtraErrors({});
      const latestData = {
        ...data,
        formData: currentFormDataRef.current,
      };

      if (onSubmit) {
        onSubmit(latestData, event);
      }
    },
    [onSubmit]
  );

  // Memoize form className
  const formClassName = useMemo(
    () => cn('p-px', withScrollArea && 'pr-4', className),
    [withScrollArea, className]
  );

  return (
    <Wrapper {...wrapperProps}>
      <Form<T, any, FormContext<T>>
        ref={formRef}
        noHtml5Validate
        formContext={formContext}
        extraErrors={extraErrors}
        focusOnFirstError
        showErrorList={showErrorList}
        disabled={disabled}
        {...restProps}
        className={formClassName}
        formData={formDataToUse}
        schema={processedSchema}
        validator={customizeValidator(
          { ajvOptionsOverrides: { removeAdditional: true } },
          locale === 'tr' ? AJV_TR : undefined
        )}
        noValidate={disableValidation}
        fields={mergedFields}
        widgets={mergedWidgets}
        templates={mergedTemplates}
        uiSchema={processedUiSchema}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onBlur={handleBlur}
        onError={() => {
          setExtraErrors({});
        }}
      >
        {children}
        {useDefaultSubmit && (
          <SchemaFormSubmit
            submit={submitText || 'Submit'}
            className={defaultSubmitClassName}
            disabled={disabled}
            id={id}
          />
        )}
      </Form>
      {withScrollArea && <ScrollBar orientation="horizontal" />}
    </Wrapper>
  );
}

// Memoize the submit component to prevent unnecessary re-renders
export const SchemaFormSubmit = memo(
  ({
    submit,
    className,
    disabled,
    id,
  }: {
    className?: string;
    disabled?: boolean;
    submit: string;
    id: string;
  }) => {
    const submitClassName = useMemo(
      () =>
        cn('py-4 sticky bottom-0 bg-white flex justify-end z-40', className),
      [className]
    );

    return (
      <div className={submitClassName}>
        <Button type="submit" disabled={disabled} data-testid={`${id}_submit`}>
          {submit}
        </Button>
      </div>
    );
  }
);

SchemaFormSubmit.displayName = 'SchemaFormSubmit';
