import { FormProps, IChangeEvent } from "@rjsf/core";
import { GenericObjectType } from "@rjsf/utils";
import { UiSchema as BaseUiSchema } from "@rjsf/utils";

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

export type RJSFFormProps<T = any> = Omit<FormProps<T>, "validator"> & {
  validator?: FormProps<T>["validator"];
};

export type RJSFChangeEvent<T = any> = IChangeEvent<T>;

export type CreateFieldConfigWithResourceProps = {
  extend?: GenericObjectType;
  name?: string;
  resources: GenericObjectType;
  schema: GenericObjectType;
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
  schema: GenericObjectType;
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
