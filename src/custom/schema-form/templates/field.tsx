import { FieldTemplateProps } from "@rjsf/utils";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { FieldLabel } from "../custom/label";
import { fieldOptionsByDependency } from "../utils/dependency";

export function FieldTemplate(props: FieldTemplateProps) {
  const {
    id,
    classNames,
    style,
    label,
    rawDescription,
    errors,
    children,
    uiSchema,
    displayLabel,
    schema,
    disabled,
  } = props;
  if (schema.type === "object" || schema.type === "array") {
    return children;
  }
  const dependencyOptions = fieldOptionsByDependency(
    uiSchema,
    props.formContext,
  );
  const required = uiSchema?.["ui:required"] || props.required;
  const fieldOptions = {
    disabled,
    required,
    ...dependencyOptions,
  };
  if (fieldOptions.hidden || uiSchema?.["ui:widget"] === "hidden")
    return children;
  return (
    <div
      className={cn(
        "w-full grid gap-1.5 h-fit",
        uiSchema?.["ui:className"],
        classNames,
      )}
      style={style}
    >
      {displayLabel && schema.type !== "boolean" && (
        <FieldLabel
          id={id}
          label={label}
          required={fieldOptions.required}
          description={rawDescription}
        />
      )}
      {/* TODO : Add description field */}
      {children}

      {errors}
      {/* <p className="text-xs">{help}</p> */}
      {/* TODO : Add help field */}
    </div>
  );
}
