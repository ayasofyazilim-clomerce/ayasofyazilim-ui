import {
  Selectable,
  SelectableProps,
} from "@repo/ayasofyazilim-ui/custom/selectable";
import { WidgetProps } from "@rjsf/utils";

export function CustomSelectableWidget<T>(
  selectableProps: Omit<SelectableProps<T>, "onChange">
) {
  const { getKey } = selectableProps;

  function Widget(widgetProps: Omit<WidgetProps, "options">) {
    const handleChange = (values: T[]) => {
      widgetProps.onChange(values.map((item) => getKey(item)));
    };
    return (
      <Selectable<T>
        {...widgetProps}
        {...selectableProps}
        onChange={handleChange}
      />
    );
  }
  return Widget;
}
