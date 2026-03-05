import { Checkbox } from "@ayasofyazilim/ui/components/checkbox";
import { Label } from "@ayasofyazilim/ui/components/label";
import { Switch } from "@ayasofyazilim/ui/components/switch";
import { cn } from "@ayasofyazilim/ui/lib/utils";
import { WidgetProps } from "@rjsf/utils";
import { ReactNode } from "react";

export const SwitchWidget = (props: WidgetProps) => {
  const { id, name, onChange, value, defaultValue, disabled, uiSchema } = props;
  const required = uiSchema?.["ui:required"] || props.required;
  return (
    <BooleanWrapper widgetProps={props}>
      <Switch
        id={id}
        data-testid={id}
        onCheckedChange={() => {
          onChange(!value);
        }}
        checked={value}
        defaultValue={value || defaultValue}
        name={name}
        disabled={disabled}
        required={required}
      />
    </BooleanWrapper>
  );
};

export const CheckboxWidget = (props: WidgetProps) => {
  const { id, name, onChange, value, defaultValue, disabled, uiSchema } = props;
  const required = uiSchema?.["ui:required"] || props.required;
  return (
    <BooleanWrapper widgetProps={props}>
      <Checkbox
        id={id}
        data-testid={id}
        onCheckedChange={() => {
          onChange(!value);
        }}
        checked={value}
        defaultValue={value || defaultValue}
        name={name}
        disabled={disabled}
        required={required}
      />
    </BooleanWrapper>
  );
};

function BooleanWrapper({
  children,
  widgetProps,
}: {
  children: ReactNode;
  widgetProps: WidgetProps;
}) {
  const { id, className, label, uiSchema } = widgetProps;
  const required = uiSchema?.["ui:required"] || widgetProps.required;
  const displayLabel = uiSchema?.displayLabel;
  return (
    <div
      data-wrapper="boolean"
      className={cn(
        "flex items-center gap-2 h-9 px-2 border rounded-md shadow-xs",
        className,
      )}
    >
      {children}
      {displayLabel !== false && (
        <Label id={id} htmlFor={id} className="w-full">
          {label}
          {required && "*"}
        </Label>
      )}
    </div>
  );
}
