import { WidgetProps } from "@rjsf/utils";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { Label } from "@repo/ayasofyazilim-ui/components/label";
import { Selectable, SelectableProps } from "../../selectable";

export const CustomSelectable = <T,>(
  props: Omit<WidgetProps, "options"> & Omit<SelectableProps<T>, "onChange">
) => {
  const { label, onChange, value, classNames, displayLabel, uiSchema, getKey } =
    props;
  const required = uiSchema?.["ui:required"] || props.required;

  const handleChange = (values: T[]) => {
    onChange(values.map((item) => getKey(item)));
  };

  return (
    <div
      className={cn(uiSchema?.["ui:className"], classNames, "w-full space-y-2")}
    >
      {label && displayLabel !== false && (
        <Label htmlFor={props.id}>
          {label}
          {required ? <span className="text-destructive">*</span> : null}
        </Label>
      )}
      <Selectable {...props} onChange={handleChange} />
    </div>
  );
};

export function CustomSelectableWidget<T>(
  selectableProps: Omit<SelectableProps<T>, "onChange">
) {
  function Widget(widgetProps: Omit<WidgetProps, "options">) {
    return <CustomSelectable<T> {...widgetProps} {...selectableProps} />;
  }
  return Widget;
}
