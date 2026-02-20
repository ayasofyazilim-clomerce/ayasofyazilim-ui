import { FormProps, IChangeEvent } from "@rjsf/core";
import { GenericObjectType as _GenericObjectType } from "@rjsf/utils";
import { UiSchema as BaseUiSchema } from "@rjsf/utils";
import type { RuntimeDependencyConfig } from "./utils/schema-dependency";
export type GenericObjectType = _GenericObjectType;
export type {
  FieldProps,
  ArrayFieldItemTemplateProps,
  ArrayFieldTemplateProps,
  FieldTemplateProps,
  ObjectFieldTemplateProps,
  TemplatesType,
  WidgetProps,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

export type SchemaFormProps<T = any> = Omit<
  FormProps<T>,
  "validator" | "schema" | "uiSchema"
> & {
  schema: _GenericObjectType;
  validator?: FormProps<T>["validator"];
  uiSchema?: UiSchema | UiSchema<T>;
  filter?: FilterType<T>;
  useTableForArrayFields?: boolean;
  /** Runtime dependency config for conditional requirements - also used to clean form data on submit */
  runtimeDependencyConfig?: RuntimeDependencyConfig;
};
export type RJSFChangeEvent<T = any> = IChangeEvent<T>;

export type CreateFieldConfigWithResourceProps = {
  extend?: _GenericObjectType;
  name?: string;
  resources: _GenericObjectType;
  schema: _GenericObjectType;
};

export type UiSchema<T = unknown> = BaseUiSchema<T>;

export type CommonFilterType<T> = {
  keys: Array<keyof Partial<T> | string>;
};
export type FilterType<T> = CommonFilterType<T> & {
  type: "include" | "exclude" | "fullExclude";
};
export type CreateSchemaWithFilters<T> = {
  filter: FilterType<T>;
  name?: string;
  schema: _GenericObjectType;
};

export type FilteredObject<T> = {
  [K in keyof T]: T[K] extends object
    ? T[K] extends Array<any>
      ? T[K] // Keep arrays as they are
      : FilteredObject<T[K]>
    : T[K] extends undefined
      ? never
      : T[K];
};
