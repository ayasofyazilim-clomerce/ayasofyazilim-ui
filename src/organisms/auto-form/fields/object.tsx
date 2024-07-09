import { useForm, useFormContext } from 'react-hook-form';
import * as z from 'zod';
import { FormField } from '@/components/ui/form';
import { DEFAULT_ZOD_HANDLERS, INPUT_COMPONENTS } from '../config';
import resolveDependencies from '../dependencies';
import { Dependency, FieldConfig, FieldConfigItem } from '../types';
import {
  beautifyObjectName,
  getBaseSchema,
  getBaseType,
  zodToHtmlInputProps,
} from '../utils';
import AutoFormArray from './array';

const DefaultParent = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

export default function AutoFormObject<
  SchemaType extends z.ZodObject<any, any>,
>({
  schema,
  form,
  fieldConfig,
  path = [],
  dependencies = [],
  isDisabled = false,
}: {
  dependencies?: Dependency<z.infer<SchemaType>>[];
  fieldConfig?: FieldConfig<z.infer<SchemaType>>;
  form: ReturnType<typeof useForm>;
  isDisabled?: boolean;
  path?: string[];
  schema: SchemaType | z.ZodEffects<SchemaType>;
}) {
  const { watch } = useFormContext(); // Use useFormContext to access the watch function

  if (!schema) {
    return null;
  }
  const { shape } = getBaseSchema<SchemaType>(schema) || {};
  if (!shape) {
    return null;
  }
  const handleIfZodNumber = (item: z.ZodAny) => {
    const isZodNumber = (item as any)._def.typeName === 'ZodNumber';
    const isInnerZodNumber =
      (item._def as any).innerType?._def?.typeName === 'ZodNumber';

    if (isZodNumber) {
      (item as any)._def.coerce = true;
    } else if (isInnerZodNumber) {
      (item._def as any).innerType._def.coerce = true;
    }

    return item;
  };
  function createItemName(item: z.ZodAny, name: string = '') {
    if (!fieldConfig)
      return item._def.description
        ? beautifyObjectName(item._def.description)
        : beautifyObjectName(name);
    return fieldConfig?.[name]?.displayName
      ? // @ts-ignore
        fieldConfig[name].displayName
      : beautifyObjectName(name);
  }
  return (
    <div className="space-y-5">
      {Object.keys(shape).map((name: string) =>
        CreateFormObject(
          name,
          shape,
          fieldConfig,
          path,
          dependencies,
          watch,
          form,
          createItemName,
          handleIfZodNumber,
          name.includes('IsApplicable') ? false : isDisabled
        )
      )}
    </div>
  );
}

function CreateFormObject<SchemaType extends z.ZodObject<any, any>>(
  name: string,
  shape: z.ZodObject<any, any>['shape'],
  fieldConfig: any,
  path: string[],
  dependencies: Dependency<z.infer<SchemaType>>[],
  watch: any,
  form: ReturnType<typeof useForm>,
  createItemName: any,
  handleIfZodNumber: (item: z.ZodAny) => z.ZodAny,
  isInputDisabled: boolean
) {
  let item = shape[name] as z.ZodAny;
  const itemName = createItemName(item, name) ?? name;
  item = handleIfZodNumber(item) as z.ZodAny;
  const zodBaseType = getBaseType(item);
  const key = [...path, name].join('.');
  const {
    isHidden,
    isDisabled,
    isRequired: isRequiredByDependency,
    overrideOptions,
  } = resolveDependencies(dependencies, name, watch);
  if (isHidden) {
    return null;
  }

  if (zodBaseType === 'ZodObject') {
    return (
      <div key={key} className="flex flex-col border p-4 rounded-md">
        <div className="text-sm font-bold">{itemName}</div>
        <div className="text-muted-foreground text-sm">
          {fieldConfig?.[name]?.description}
        </div>
        <div className="p-2">
          <AutoFormObject
            isDisabled={isDisabled}
            dependencies={dependencies}
            // @ts-ignore
            schema={item as unknown as z.ZodObject<any, any>}
            form={form}
            fieldConfig={
              (fieldConfig?.[name] ?? {}) as FieldConfig<z.infer<typeof item>>
            }
            path={[...path, name]}
          />
        </div>
      </div>
    );
  }
  if (zodBaseType === 'ZodArray') {
    return (
      <AutoFormArray
        key={key}
        name={name}
        item={item as unknown as z.ZodArray<any>}
        form={form}
        fieldConfig={fieldConfig?.[name] ?? {}}
        path={[...path, name]}
      />
    );
  }

  const fieldConfigItem: FieldConfigItem = fieldConfig?.[name] ?? {};
  const zodInputProps = zodToHtmlInputProps(item);
  const isRequired =
    isRequiredByDependency ||
    zodInputProps.required ||
    fieldConfigItem.inputProps?.required ||
    false;

  if (overrideOptions) {
    item = z.enum(overrideOptions) as unknown as z.ZodAny;
  }

  return (
    <FormField
      // disabled={isDisabled}
      control={form.control}
      name={key}
      key={key}
      render={({ field }) => {
        const inputType =
          fieldConfigItem.fieldType ??
          DEFAULT_ZOD_HANDLERS[zodBaseType] ??
          'fallback';

        const InputComponent =
          typeof inputType === 'function'
            ? inputType
            : INPUT_COMPONENTS[inputType];

        const ParentElement = fieldConfigItem.renderParent ?? DefaultParent;

        const defaultValue = fieldConfigItem.inputProps?.defaultValue;
        const value = field.value ?? defaultValue ?? '';

        const fieldProps = {
          ...zodToHtmlInputProps(item),
          ...field,
          ...fieldConfigItem.inputProps,
          disabled:
            fieldConfigItem.inputProps?.disabled ||
            isDisabled ||
            isInputDisabled,
          ref: undefined,
          value,
        };
        if (InputComponent === undefined) {
          return <></>;
        }
        return (
          <ParentElement key={`${key}.parent`}>
            <InputComponent
              zodInputProps={zodInputProps}
              field={field}
              fieldConfigItem={fieldConfigItem}
              label={itemName.toString()}
              isRequired={isRequired}
              zodItem={item}
              fieldProps={fieldProps}
              className={fieldProps.className}
            />
          </ParentElement>
        );
      }}
    />
  );
}
