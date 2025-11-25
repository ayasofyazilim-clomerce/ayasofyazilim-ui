import { DatePicker } from "@repo/ayasofyazilim-ui/custom/date-picker";
import { WidgetProps } from "@rjsf/utils";

export const DateWidget = (props: WidgetProps) => {
  const { value, onChange, disabled, uiSchema } = props;

  const initialDate =
    value && !Number.isNaN(new Date(value).getTime())
      ? new Date(new Date(value).toJSON())
      : undefined;
  return (
    <DatePicker
      id={props.id}
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
  const { value, onChange, disabled, uiSchema } = props;

  const initialDate =
    value && !Number.isNaN(new Date(value).getTime())
      ? new Date(new Date(value).toJSON())
      : undefined;
  return (
    <DatePicker
      id={props.id}
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
