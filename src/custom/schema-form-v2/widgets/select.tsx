import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from "@rjsf/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ayasofyazilim-ui/components/select";
import { Selectable } from "@repo/ayasofyazilim-ui/custom/selectable";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */

interface EnumOption {
  value: string;
  label: string;
  // Add other properties if your options have them (e.g., key, rawData)
}

// 2. Define the shape of the transformed item (optional, but good for clarity)
interface MappedItem {
  value: string;
  label: string;
  disabled: boolean;
}

export function SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  options,
  required,
  disabled,
  value,
  multiple,
  onChange,
  rawErrors = [],
  className,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyValue } = options;
  const items: MappedItem[] = (enumOptions as EnumOption[])?.map(
    ({ value, label }: EnumOption) => {
      return {
        value,
        label,
        disabled: Array.isArray(enumDisabled) && enumDisabled.includes(value),
      };
    }
  );
  const cnClassName = cn(
    "w-full",
    { "border-destructive": rawErrors.length > 0 },
    className
  );
  return !multiple ? (
    <Select
      required={required}
      value={value}
      onValueChange={(val) => {
        onChange(val);
      }}
    >
      <SelectTrigger className={cnClassName} id={id}>
        <SelectValue placeholder={optEmptyValue} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => {
          return (
            <SelectItem
              disabled={item.disabled}
              key={item.value}
              value={item.value}
            >
              {item.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  ) : (
    <Selectable<MappedItem>
      id={id}
      getKey={(opt) => opt.value}
      getLabel={(opt) => opt.label}
      options={items}
      onChange={(val) => {
        onChange(val.map((item) => item.value));
      }}
      disabled={disabled}
      makeAChoiceText={optEmptyValue}
    />
  );
}
