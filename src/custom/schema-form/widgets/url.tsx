import {} from "@radix-ui/react-tooltip";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@repo/ayasofyazilim-ui/components/input-group";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { WidgetProps } from "@rjsf/utils";

export const URLInputWidget = (props: WidgetProps) => {
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
    <InputGroup>
      <InputGroupInput
        placeholder="example.com"
        id={id}
        data-testid={id}
        onBlur={
          props.onBlur && ((event) => props.onBlur(id, event.target.value))
        }
        className={cn("pl-1!", className)}
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
        onKeyDown={(e) => {
          e.key === "Enter" && e.preventDefault();
        }}
      />
      <InputGroupAddon>
        <InputGroupText>{props.placeholder}</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  );
};
