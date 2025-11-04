import { Input } from "@repo/ayasofyazilim-ui/components/input";
import { fieldOptionsByDependency } from "../utils/dependency";
import { WidgetProps } from "../types";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";

export const CustomTextInput = (props: WidgetProps) => {
  const { uiSchema, className, id, disabled, onChange, value } = props;
  const uiOptions = uiSchema?.["ui:options"];
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
    <Input
      type={uiOptions?.inputType || "text"}
      id={id}
      data-testid={id}
      onBlur={props.onBlur && ((event) => props.onBlur(id, event.target.value))}
      className={className}
      required={fieldOptions.required}
      onChange={(event) => {
        if (event.target.value === "") {
          onChange(undefined);
        } else {
          onChange(event.target.value);
        }
      }}
      defaultValue={value ?? props.defaultValue}
      readOnly={props.readOnly}
      disabled={fieldOptions.disabled}
      autoComplete={uiSchema?.["ui:autocomplete"]}
    />
  );
};
