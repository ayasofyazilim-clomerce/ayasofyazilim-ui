import { ObjectFieldTemplateProps } from "@rjsf/utils";
import { Fragment } from "react/jsx-runtime";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { fieldOptionsByDependency } from "../utils/dependency";
import { FieldLabel } from "../custom/label";
import { TableArrayObjectFieldTemplate } from "./table-array";

export const ObjectFieldTemplate = (props: ObjectFieldTemplateProps) => {
  const { uiSchema, title, disabled, description, formContext } = props;
  const dependencyOptions = fieldOptionsByDependency(uiSchema, formContext);
  const required = uiSchema?.["ui:required"] || props.required;
  const fieldOptions = {
    disabled,
    required,
    ...dependencyOptions,
  };
  if (fieldOptions.hidden) return null;
  // This is not an valid implementation, but a workaround to display array objects as table.
  const isArrayField = formContext.arrayFields.some((field: string) => {
    const regex = new RegExp(`^${field}(-\\d+)?$`);
    return regex.test(props.title);
  });
  if (isArrayField && formContext.useTableForArrayItems) {
    return <TableArrayObjectFieldTemplate {...props} />;
  }
  return (
    <div
      className={cn(
        "flex flex-col gap-3 flex-1 w-full",
        title && "border p-4 rounded-md bg-white",
        uiSchema?.["ui:className"]
      )}
    >
      {title && uiSchema?.displayLabel !== false && (
        <FieldLabel
          id={title}
          label={title}
          required={fieldOptions.required}
          description={description}
          className="col-span-full"
        />
      )}

      {props.properties.map((element) => (
        <Fragment key={element.name}>{element.content}</Fragment>
      ))}
    </div>
  );
};
