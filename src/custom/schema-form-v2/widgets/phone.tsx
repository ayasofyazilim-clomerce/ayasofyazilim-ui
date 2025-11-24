"use client";

import { PhoneInput } from "@repo/ayasofyazilim-ui/custom/phone-input";
import { WidgetProps } from "@rjsf/utils";

export const PhoneWithParseWidget = function CustomPhoneFieldWithParse<T>(
  props: WidgetProps
) {
  const required = props.required || props.uiSchema?.["ui:required"];
  return <PhoneInput {...props} required={required} defaultValue={undefined} />;
};

export const PhoneWithValueWidget = function CustomPhoneFieldWithValue<T>(
  props: WidgetProps
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
