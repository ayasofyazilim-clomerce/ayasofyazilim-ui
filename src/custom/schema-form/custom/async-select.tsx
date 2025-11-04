import { WidgetProps } from "@rjsf/utils";
import AsyncSelectCore, {
  AsyncSelectType,
} from "@repo/ayasofyazilim-ui/custom/async-select";
import { fieldOptionsByDependency } from "../utils/dependency";

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export function AsyncSelectWidget(
  props: Omit<Optional<AsyncSelectType, "value">, "onChange">
) {
  function Widget(widgetProps: WidgetProps) {
    const { value, uiSchema, disabled, onChange, required, formContext } =
      widgetProps;
    const dependencyOptions = fieldOptionsByDependency(uiSchema, formContext);
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
      <AsyncSelectCore
        {...props}
        classNames={{
          trigger: "h-10 hover:bg-white bg-white shadow-sm",
        }}
        value={value || []}
        onChange={onChange}
      />
    );
  }
  return Widget;
}
