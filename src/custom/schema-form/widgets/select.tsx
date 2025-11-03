import { WidgetProps } from "@rjsf/utils";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@repo/ayasofyazilim-ui/components/select";
import { fieldOptionsByDependency } from "../utils/dependency";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { beautifyLabel } from "../utils";

export const CustomSelect = (props: WidgetProps) => {
  const { label, options, onChange, value, defaultValue, disabled, uiSchema } =
    props;
  const _value = value?.toString() || defaultValue?.toString();

  const dependencyOptions = fieldOptionsByDependency(
    uiSchema,
    props.formContext,
  );
  const required = uiSchema?.["ui:required"] || props.required;
  const fieldOptions = {
    disabled,
    required,
    ...dependencyOptions,
  };
  if (fieldOptions.hidden) {
    onChange(undefined);
    return null;
  }

  const hasValue = !!_value;
  return (
    <Select
      defaultValue={_value}
      onValueChange={(value) => {
        onChange(value);
      }}
    >
      <SelectTrigger
        id={props.id}
        data-testid={props.id}
        className={cn(
          "h-10",
          hasValue ? "text-black " : "text-muted-foreground",
        )}
        disabled={fieldOptions.disabled}
      >
        <SelectValue
          placeholder={
            _value ||
            props?.uiSchema?.["ui:placeholder"] ||
            `Please select an ${beautifyLabel(label)}`
          }
        />
      </SelectTrigger>
      <SelectContent id={`${props.id}_content`}>
        {options.enumOptions?.map((enumOption) => (
          <SelectItem
            data-testid={`${props.id}_${enumOption.value}`}
            key={JSON.stringify(enumOption.value)}
            value={enumOption.value.toString()}
          >
            {enumOption.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
