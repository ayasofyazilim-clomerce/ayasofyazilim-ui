import { WidgetProps } from "@rjsf/utils";
import { Switch } from "@repo/ayasofyazilim-ui/components/switch";
import { FieldLabel } from "../custom/label";
import { fieldOptionsByDependency } from "../utils/dependency";

export const CustomSwitch = (props: WidgetProps) => {
  const {
    id,
    className,
    name,
    label,
    onChange,
    value,
    defaultValue,
    disabled,
    uiSchema,
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
      <Switch
        id={id}
        data-testid={id}
        className={className}
        onCheckedChange={() => {
          onChange(!value);
        }}
        checked={value}
        defaultValue={value || defaultValue}
        name={name}
        disabled={fieldOptions.disabled}
        required={fieldOptions.required}
      />
      <FieldLabel id={id} required={fieldOptions.required} label={label} />
    </div>
  );
};
