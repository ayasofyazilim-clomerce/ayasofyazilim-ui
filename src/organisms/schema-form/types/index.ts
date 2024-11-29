import { FormProps } from '@rjsf/core';
import { GenericObjectType, UiSchema } from '@rjsf/utils';

export interface SchemaFormProps<T>
  extends Omit<FormProps<T>, 'validator' | 'uiSchema'> {
  defaultSubmitClassName?: string;
  filter?: FilterType<T>;
  schema: GenericObjectType;
  submitText?: string;
  uiSchema?: UiSchema;
  useDefaultSubmit?: boolean;
  withScrollArea?: boolean;
}

export type FilterType<T> = CommonFilterType<T> &
  (
    | SortableFilterType
    | {
        type: 'fullExclude';
      }
  );
export type CommonFilterType<T> = {
  keys: Partial<Array<keyof T | string>>;
};
type SortableFilterType = {
  sort?: boolean;
  type: 'include' | 'exclude';
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

export type { WidgetProps, FieldProps, TemplatesType } from '@rjsf/utils';
