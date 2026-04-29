import { DatePicker } from "@repo/ayasofyazilim-ui/custom/date-picker";
import { WidgetProps } from "@rjsf/utils";

export const DateWidget = (props: WidgetProps) => {
  const { value, onChange, disabled, registry } = props;
  const locale = registry.formContext?.locale;

  const initialDate =
    value && !Number.isNaN(new Date(value).getTime())
      ? new Date(new Date(value).toJSON())
      : undefined;
  return (
    <DatePicker
      id={props.id}
      locale={locale}
      defaultValue={initialDate}
      disabled={disabled}
      classNames={{
        dateInput: " shadow-xs date-input",
      }}
      onChange={(selectedDate) => {
        if (selectedDate) {
          if (props.schema.format === "date") {
            onChange(selectedDate.toISOString().split("T").at(0));
          } else {
            onChange(selectedDate.toISOString());
          }
        }
      }}
    />
  );
};

export const DateTimeWidget = (props: WidgetProps) => {
  const { value, onChange, disabled, registry } = props;
  const locale = registry.formContext?.locale;

  const initialDate =
    value && !Number.isNaN(new Date(value).getTime())
      ? new Date(new Date(value).toJSON())
      : undefined;
  return (
    <DatePicker
      id={props.id}
      locale={locale}
      defaultValue={initialDate}
      useTime
      disabled={disabled}
      classNames={{
        dateInput: "shadow-xs date-input",
      }}
      onChange={(selectedDate) => {
        if (selectedDate) {
          if (props.schema.format === "date") {
            onChange(selectedDate.toISOString().split("T").at(0));
          } else {
            onChange(selectedDate.toISOString());
          }
        }
      }}
    />
  );
};
