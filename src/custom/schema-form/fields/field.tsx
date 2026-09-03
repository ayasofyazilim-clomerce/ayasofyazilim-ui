import { TableCell } from "@repo/ayasofyazilim-ui/components/table";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { FieldTemplateProps } from "@rjsf/utils";
import { FieldLabel } from "../custom";

export const FieldTemplate = (props: FieldTemplateProps) => {
  const {
    id,
    classNames,
    style,
    label,
    help,
    required,
    description,
    errors,
    children,
    displayLabel,
    hidden,
    schema,
    registry,
  } = props;

  const shouldRenderLabel = label && displayLabel && schema.type !== "boolean";
  if (hidden) return null;
  const isInArray = /root_\w+_\d+/.test(id);
  const { useTableForArrayFields } = registry.formContext;
  if (schema.type === "object" && isInArray && useTableForArrayFields)
    return children;
  if (isInArray && useTableForArrayFields)
    return (
      <TableCell
        className={cn(
          "p-0",
          "*:data-wrapper:border-0 *:data-wrapper:shadow-none *:data-wrapper:rounded-none *:data-wrapper:justify-center",
          "**:[[role=combobox]]:border-0 **:[[role=combobox]]:shadow-none **:[[role=combobox]]:rounded-none",
          "**:data-[slot=input]:border-0 **:data-[slot=input]:shadow-none **:data-[slot=input]:rounded-none",
          "**:data-rac:border-0 **:data-rac:shadow-none **:data-rac:rounded-none",
          "*:data-[slot=drawer-trigger]:border-0"
        )}
      >
        {children}
        {/* Without this the cell swallows its field's validation errors, and
            since SchemaForm also defaults showErrorList to false, a failed
            submit inside a table array reports nothing at all - the form just
            refuses to save. Only the cell branch gets them: the object branch
            above renders straight into a <TableRow>, where a stray node would
            be invalid table markup. */}
        {errors}
      </TableCell>
    );
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 h-max",
        props.schema.type === "object" && "gap-3",
        classNames,
        label
      )}
      style={style}
    >
      {shouldRenderLabel && (
        <FieldLabel
          id={id}
          label={label}
          description={description}
          required={required}
        />
      )}
      {children}
      {errors}
      {help}
    </div>
  );
};
