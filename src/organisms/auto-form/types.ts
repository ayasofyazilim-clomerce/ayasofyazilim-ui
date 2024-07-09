import { ControllerRenderProps, FieldValues } from 'react-hook-form';
import * as z from 'zod';
import React from 'react';
import { INPUT_COMPONENTS } from './config';

export type FieldConfigItem = {
  description?: React.ReactNode;
  displayName?: string;
  fieldType?:
    | keyof typeof INPUT_COMPONENTS
    | React.FC<AutoFormInputComponentProps>;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement> & {
    showLabel?: boolean;
  };

  renderParent?: (props: {
    children: React.ReactNode;
  }) => React.ReactElement | null;
};

export type FieldConfig<SchemaType extends z.infer<z.ZodObject<any, any>>> = {
  // If SchemaType.key is an object, create a nested FieldConfig, otherwise FieldConfigItem
  [Key in keyof SchemaType]?: SchemaType[Key] extends object
    ? FieldConfig<z.infer<SchemaType[Key]>>
    : FieldConfigItem;
};

export enum DependencyType {
  DISABLES = 'DISABLES',
  HIDES = 'HIDES',
  REQUIRES = 'REQUIRES',
  SETS_OPTIONS = 'SETS_OPTIONS',
}
export type BaseDependency<SchemaType extends z.infer<z.ZodObject<any, any>>> =
  {
    hasParentField?: boolean;
    sourceField: keyof SchemaType;
    targetField: keyof SchemaType;
    type: DependencyType;
    when: (sourceFieldValue: any, targetFieldValue: any) => boolean;
  };

export type ValueDependency<SchemaType extends z.infer<z.ZodObject<any, any>>> =
  BaseDependency<SchemaType> & {
    type:
      | DependencyType.DISABLES
      | DependencyType.REQUIRES
      | DependencyType.HIDES;
  };

export type EnumValues = readonly [string, ...string[]];

export type OptionsDependency<
  SchemaType extends z.infer<z.ZodObject<any, any>>,
> = BaseDependency<SchemaType> & {
  // Partial array of values from sourceField that will trigger the dependency
  options: EnumValues;

  type: DependencyType.SETS_OPTIONS;
};

export type Dependency<SchemaType extends z.infer<z.ZodObject<any, any>>> =
  | ValueDependency<SchemaType>
  | OptionsDependency<SchemaType>;

/**
 * A FormInput component can handle a specific Zod type (e.g. "ZodBoolean")
 */
export type AutoFormInputComponentProps = {
  className?: string;
  field: ControllerRenderProps<FieldValues, any>;
  fieldConfigItem: FieldConfigItem;
  fieldProps: any;
  isRequired: boolean;
  label: string;
  zodInputProps: React.InputHTMLAttributes<HTMLInputElement>;
  zodItem: z.ZodAny;
};
