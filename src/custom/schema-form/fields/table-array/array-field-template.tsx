import { Button } from "@repo/ayasofyazilim-ui/components/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ayasofyazilim-ui/components/table";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import {
  ArrayFieldTemplateProps,
  buttonId,
  getTemplate,
  getUiOptions,
} from "@rjsf/utils";
import { PlusCircle } from "lucide-react";

export function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
  const {
    canAdd,
    disabled,
    fieldPathId,
    uiSchema,
    items,
    optionalDataControl,
    onAddClick,
    readonly,
    registry,
    required,
    schema,
    title,
  } = props;
  const uiOptions = getUiOptions(uiSchema);
  const ArrayFieldDescriptionTemplate = getTemplate(
    "ArrayFieldDescriptionTemplate",
    registry,
    uiOptions
  );
  const ArrayFieldTitleTemplate = getTemplate(
    "ArrayFieldTitleTemplate",
    registry,
    uiOptions
  );
  const showOptionalDataControlInTitle = !readonly && !disabled;

  return (
    <div className="border rounded-md overflow-hidden">
      <Table key={`array-item-list-${fieldPathId.$id}`} className="caption-top">
        {!showOptionalDataControlInTitle ? optionalDataControl : undefined}
        <TableCaption className="border-b mt-0  [&_h5]:font-medium [&_h5]:text-black **:data-[slot=separator]:hidden">
          <ArrayFieldTitleTemplate
            fieldPathId={fieldPathId}
            title={uiOptions.title || title}
            schema={schema}
            uiSchema={uiSchema}
            required={required}
            registry={registry}
            optionalDataControl={
              showOptionalDataControlInTitle ? optionalDataControl : undefined
            }
          />
          <ArrayFieldDescriptionTemplate
            fieldPathId={fieldPathId}
            description={uiOptions.description || schema.description}
            schema={schema}
            uiSchema={uiSchema}
            registry={registry}
          />
        </TableCaption>
        <TableHeader>
          <TableRow className="divide-x">
            {Object.keys(
              (schema?.items as { properties: Record<string, string> })
                ?.properties || {}
            ).map((item) => {
              const itemsUiSchema =
                typeof uiSchema?.items === "function"
                  ? undefined
                  : (uiSchema?.items as
                      | Record<string, { "ui:title": string }>
                      | undefined);
              const title =
                itemsUiSchema?.[item as string]?.["ui:title"] || item;
              return (
                <TableHead
                  key={item}
                  className={cn("h-9", !canAdd && "nth-last-2:border-0!")}
                >
                  {title}
                </TableHead>
              );
            })}
            <TableHead className={cn("p-0 size-9")}>
              {canAdd && (
                <Button
                  id={buttonId(fieldPathId, "add")}
                  onClick={onAddClick}
                  disabled={disabled || readonly}
                  className="rounded-none h-full"
                  variant="ghost"
                >
                  <PlusCircle className="size-4" />
                </Button>
              )}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr:last-child>td]:rounded-md">
          {items}
        </TableBody>
      </Table>
    </div>
  );
}
