import { WidgetProps } from "@rjsf/utils";
import { Checkbox } from "@repo/ayasofyazilim-ui/components/checkbox";
import { FieldLabel } from "../custom/label";
import { fieldOptionsByDependency } from "../utils/dependency";

export const CustomCheckbox = (props: WidgetProps) => {
  const {
    uiSchema,
    id,
    className,
    onChange,
    value,
    defaultValue,
    disabled,
    name,
    label,
  } = props;
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
  if (fieldOptions.hidden) return null;
  return (
    <div className="flex items-center gap-2 h-10">
      <Checkbox
        id={id}
        data-testid={id}
        className={className}
        onCheckedChange={() => {
          onChange(!value);
        }}
        checked={value}
        defaultValue={value || defaultValue}
        name={name}
        required={fieldOptions.required}
        disabled={fieldOptions.disabled}
      />
      <FieldLabel id={id} label={label} required={fieldOptions.required} />
    </div>
  );
};
