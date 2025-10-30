'use client';

import { FieldProps } from '@rjsf/utils';
import { useMemo } from 'react';
import TanstackTable from '@repo/ayasofyazilim-ui/custom/tanstack-table';
import { TanstackTablePropsType } from '@repo/ayasofyazilim-ui/custom/tanstack-table/types';
import { ErrorSchemaTemplate } from '../fields';
import { cn } from '@repo/ayasofyazilim-ui/lib/utils';
import { fieldOptionsByDependency } from '../utils/dependency';
import { FieldLabel } from './label';

type TableFieldProps<TData> = Omit<
  TanstackTablePropsType<TData, TData>,
  'onTableDataChange'
>;

export function TableField<TData>({ ...tableProps }: TableFieldProps<TData>) {
  const Field = (props: FieldProps) => {
    const { uiSchema, id, disabled, required } = props;
    const title = uiSchema?.['ui:title'];
    const dependencyOptions = fieldOptionsByDependency(
      uiSchema,
      props.formContext
    );
    const fieldOptions = {
      disabled,
      required,
      ...dependencyOptions,
    };
    const memory = useMemo(
      () => (
        <div
          className={cn(
            'flex flex-col border rounded-md p-4',
            disabled && 'opacity-50 [&>div]:pointer-events-none select-none',
            uiSchema?.['ui:className']
          )}
        >
          <FieldLabel id={id} label={title} required={fieldOptions.required} />
          <TanstackTable
            {...tableProps}
            editable
            rowCount={undefined}
            onTableDataChange={(data) => {
              props.onChange(data);
            }}
          />
          <ErrorSchemaTemplate errorSchema={props.errorSchema} />
        </div>
      ),
      [props.errorSchema, props.disabled]
    );
    if (fieldOptions.hidden) return null;
    return memory;
  };
  return Field;
}
