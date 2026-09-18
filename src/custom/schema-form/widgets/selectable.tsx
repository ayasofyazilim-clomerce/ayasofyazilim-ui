import {
  Selectable,
  SelectableProps,
} from "@repo/ayasofyazilim-ui/custom/selectable";
import { WidgetProps } from "@rjsf/utils";

export function CustomSelectableWidget<T>(
  selectableProps: Omit<SelectableProps<T>, "onChange">
) {
  const { getKey, options, defaultValue } = selectableProps;

  function Widget(widgetProps: Omit<WidgetProps, "options">) {
    const handleChange = (values: T[]) => {
      widgetProps.onChange(values.map((item) => getKey(item)));
    };
    // Selectable keeps the selection in internal state seeded from
    // defaultValue, so a field that already holds keys has to be matched back
    // to its options or an existing record opens with nothing selected.
    const selectedKeys: unknown[] = Array.isArray(widgetProps.value)
      ? widgetProps.value
      : [];
    const valueAsOptions = options?.filter((option) =>
      selectedKeys.includes(getKey(option))
    );
    return (
      <Selectable<T>
        {...widgetProps}
        {...selectableProps}
        defaultValue={defaultValue ?? valueAsOptions}
        onChange={handleChange}
      />
    );
  }
  return Widget;
}
