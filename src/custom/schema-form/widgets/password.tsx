import { WidgetProps } from "@rjsf/utils";
import { PasswordInput } from "@repo/ayasofyazilim-ui/custom/password-input";
import { fieldOptionsByDependency } from "../utils/dependency";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";

export const PasswordInputWidget = (props: WidgetProps) => {
  const {
    uiSchema,
    id,
    className,
    onChange,
    value,
    defaultValue,
    disabled,
    readOnly,
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
  if (fieldOptions.hidden) {
    onChange(undefined);
    return null;
  }
  return (
    <PasswordInput
      id={id}
      data-testid={id}
      onBlur={props.onBlur && ((event) => props.onBlur(id, event.target.value))}
      className={cn("h-10", className)}
      required={required}
      onChange={(event) => {
        if (event.target.value === "") {
          onChange(undefined);
        } else {
          onChange(event.target.value);
        }
      }}
      defaultValue={value || defaultValue}
      readOnly={readOnly}
      disabled={fieldOptions.disabled}
      autoComplete={uiSchema?.["ui:autocomplete"]}
      showGenerator={uiSchema?.["ui:showGenerator"]}
      passwordLength={uiSchema?.["ui:passwordLength"] || 10}
    />
  );
};
