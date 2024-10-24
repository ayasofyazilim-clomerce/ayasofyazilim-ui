import { FormProps } from '@rjsf/core';
import { GenericObjectType } from '@rjsf/utils';

export interface SchemaFormProps extends Omit<FormProps, 'validator'> {
  filter?: FilterType;
  schema: GenericObjectType;
  submit: string;
  usePhoneField?: boolean;
  withScrollArea?: boolean;
}

export type FilterType = CommonFilterType &
  (
    | SortableFilterType
    | {
        type: 'fullExclude';
      }
  );
type CommonFilterType = {
  keys: string[];
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
