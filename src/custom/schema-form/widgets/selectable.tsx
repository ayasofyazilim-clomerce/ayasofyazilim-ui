import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { WidgetProps } from "@rjsf/utils";
import { Selectable, SelectableProps } from "../../selectable";
import { FieldLabel } from "../custom";

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
        <FieldLabel required={required} label={label} id={props.id} />
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
