import { WidgetProps } from "@rjsf/utils";
import { Textarea } from "@repo/ayasofyazilim-ui/components/textarea";
import { fieldOptionsByDependency } from "../utils/dependency";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";

export const CustomTextareaInput = (props: WidgetProps) => {
  const { className, id, uiSchema, disabled, onChange, value } = props;
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
    <Textarea
      id={id}
      data-testid={id}
      onBlur={props.onBlur && ((event) => props.onBlur(id, event.target.value))}
      className={cn("min-h-9", className)}
      required={fieldOptions.required}
      onChange={(event) => {
        if (event.target.value === "") {
          onChange(undefined);
        } else {
          onChange(event.target.value);
        }
      }}
      defaultValue={value || props.defaultValue}
      readOnly={props.readOnly}
      disabled={fieldOptions.disabled}
    />
  );
};
