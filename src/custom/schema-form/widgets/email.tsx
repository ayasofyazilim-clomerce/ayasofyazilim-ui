import { WidgetProps } from "@rjsf/utils";
import { useState } from "react";
import { Input } from "@repo/ayasofyazilim-ui/components/input";
import { fieldOptionsByDependency } from "../utils/dependency";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { EmailInput } from "@repo/ayasofyazilim-ui/custom/email-input";

export const EmailInputWidget = (props: WidgetProps) => {
  const {
    uiSchema,
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
  const [email, setEmail] = useState(value || "");
  return (
    <EmailInput
      id={props.id}
      value={email}
      onValueChange={(val) => {
        setEmail(val);
        onChange(val);
      }}
      onBlur={
        props.onBlur && ((event) => props.onBlur(props.id, event.target.value))
      }
      defaultValue={defaultValue}
      readOnly={readOnly}
      placeholder={props.placeholder || "Try typing 'john@gmail.com'"}
      className={cn("w-full", className)}
      suggestions={uiSchema?.["ui:baseList"] ?? []}
    />
  );
};

export const EmailInputWidgetOld = (props: WidgetProps) => {
  const {
    uiSchema,
    id,
    className,
    onChange,
    value,
    defaultValue,
    disabled,
    readOnly,
    required,
  } = props;
  const dependencyOptions = fieldOptionsByDependency(
    uiSchema,
    props.formContext,
  );
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
      type="email"
      id={id}
      className={cn("h-10", className)}
      onBlur={props.onBlur && ((event) => props.onBlur(id, event.target.value))}
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
    />
  );
};
