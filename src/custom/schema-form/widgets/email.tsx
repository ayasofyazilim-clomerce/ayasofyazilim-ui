import { EmailInput } from "@repo/ayasofyazilim-ui/custom/email-input";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { WidgetProps } from "@rjsf/utils";
import { useState } from "react";

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

  const [email, setEmail] = useState(value || "");
  return (
    <EmailInput
      disabled={disabled}
      id={props.id}
      value={email}
      onValueChange={(val) => {
        setEmail(val);
        onChange(val);
      }}
      defaultValue={defaultValue}
      readOnly={readOnly}
      placeholder={props.placeholder || "Try typing 'john@gmail.com'"}
      className={cn("w-full", className)}
      suggestions={uiSchema?.["ui:baseList"] ?? []}
    />
  );
};
