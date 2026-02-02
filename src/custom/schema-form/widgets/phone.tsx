"use client";

import { PhoneInput, PhoneInputProps } from "@repo/ayasofyazilim-ui/custom/phone-input";
import { WidgetProps } from "@rjsf/utils";

export function CustomPhoneFieldWithParse<T>(
  props: Partial<Omit<WidgetProps<T>, "onChange" | "id">> & Omit<PhoneInputProps, "required" | "defaultValue" | "id">
) {
  const required = props.required || props.uiSchema?.["ui:required"];
  return <PhoneInput {...props} id={props.id || ""} required={required} defaultValue={undefined} />;
};
export const PhoneWithParseWidget = CustomPhoneFieldWithParse;

export const PhoneWithValueWidget = function CustomPhoneFieldWithValue(
  props: WidgetProps & { defaultCountry?: string }
) {
  const { onChange, uiSchema } = props;
  const required = uiSchema?.["ui:required"] || props.required;
  return (
    <PhoneInput
      {...props}
      required={required}
      defaultValue={undefined}
      onChange={(values) => {
        onChange(values.value);
      }}
    />
  );
};