import { DatePicker } from "@repo/ayasofyazilim-ui/custom/date-picker";
import { WidgetProps } from "../types";
import { fieldOptionsByDependency } from "../utils/dependency";

export const CustomDate = (props: WidgetProps) => {
  const { value, onChange, disabled, uiSchema } = props;
  const dependencyOptions = fieldOptionsByDependency(
    uiSchema,
    props.formContext
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
  const initialDate =
    value && !Number.isNaN(new Date(value).getTime())
      ? new Date(new Date(value).toJSON())
      : undefined;
  return (
    <DatePicker
      id={props.id}
      defaultValue={initialDate}
      disabled={fieldOptions.disabled}
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

export const CustomDateWithTime = (props: WidgetProps) => {
  const { value, onChange, disabled, uiSchema } = props;
  const dependencyOptions = fieldOptionsByDependency(
    uiSchema,
    props.formContext
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
  const initialDate =
    value && !Number.isNaN(new Date(value).getTime())
      ? new Date(new Date(value).toJSON())
      : undefined;
  return (
    <DatePicker
      id={props.id}
      defaultValue={initialDate}
      useTime
      disabled={fieldOptions.disabled}
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
