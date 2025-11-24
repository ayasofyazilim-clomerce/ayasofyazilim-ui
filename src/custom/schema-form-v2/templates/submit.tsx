import React from "react";
import {
  getSubmitButtonOptions,
  SubmitButtonProps,
  UISchemaSubmitButtonOptions,
} from "@rjsf/utils";
import { Button } from "@repo/ayasofyazilim-ui/components/button";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";

export function SubmitButton(props: SubmitButtonProps) {
  const { uiSchema } = props;
  const {
    norender,
    props: options,
    disabled,
    submitText,
  }: UISchemaSubmitButtonOptions & {
    disabled?: boolean;
  } = getSubmitButtonOptions(uiSchema);
  if (norender) {
    return null;
  }
  return (
    <Button
      type="submit"
      className={cn("w-full mt-3", options?.className)}
      disabled={options?.disabled || disabled}
    >
      {submitText || "Submit"}
    </Button>
  );
}
