import { WidgetProps } from "@rjsf/utils";
import {
  MultiSelect,
  MultiSelectProps,
} from "@repo/ayasofyazilim-ui/custom/multi-select";
import { Label } from "@repo/ayasofyazilim-ui/components/label";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { fieldOptionsByDependency } from "../utils/dependency";

type CustomMultiSelectProps = Omit<MultiSelectProps, "options" | "onChange"> & {
  optionList: MultiSelectProps["options"];
};

export function CustomMultiSelect(
  props: CustomMultiSelectProps & Omit<WidgetProps, "options">
) {
  const {
    value,
    defaultValue,
    uiSchema,
    optionList,
    onChange,
    id,
    label,
    classNames,
    displayLabel,
    disabled,
  } = props;
  const fieldValue: string[] = Array.isArray(value)
    ? value
    : defaultValue || [];
  const uiOptions = uiSchema?.["ui:options"];
  const placeholder =
    props.placeholder ||
    uiSchema?.["ui:placeholder"] ||
    uiOptions?.["ui:placeholder"];

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
  if (fieldOptions.hidden) return null;
  return (
    <div className={cn(uiSchema?.["ui:className"], classNames, "w-full")}>
      {label && displayLabel !== false && (
        <Label htmlFor={id}>
          {label}
          {required ? <span className="text-destructive">*</span> : null}
        </Label>
      )}
      <MultiSelect
        {...props}
        defaultValue={fieldValue}
        placeholder={placeholder}
        options={optionList}
        disabled={fieldOptions.disabled}
        onValueChange={(values) => {
          onChange(values);
        }}
      />
    </div>
  );
}

export function CustomMultiSelectWidget(props: CustomMultiSelectProps) {
  function Widget(_props: Omit<WidgetProps, "options">) {
    return (
      <CustomMultiSelect
        {..._props}
        optionList={props.optionList}
        title={props.title}
      />
    );
  }
  return Widget;
}
