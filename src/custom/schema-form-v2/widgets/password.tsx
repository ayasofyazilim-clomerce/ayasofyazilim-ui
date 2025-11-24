import { WidgetProps } from "@rjsf/utils";
import { PasswordInput } from "@repo/ayasofyazilim-ui/custom/password-input";

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

  const required = uiSchema?.["ui:required"] || props.required;

  return (
    <PasswordInput
      id={id}
      data-testid={id}
      onBlur={props.onBlur && ((event) => props.onBlur(id, event.target.value))}
      className={className}
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
      disabled={disabled}
      autoComplete={uiSchema?.["ui:autocomplete"]}
      showGenerator={uiSchema?.["ui:showGenerator"]}
      passwordLength={uiSchema?.["ui:passwordLength"] || 10}
    />
  );
};
