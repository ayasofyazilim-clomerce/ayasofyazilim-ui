import { ArrayFieldTemplateProps } from "@rjsf/utils";
import { CircleXIcon, Copy, PlusCircle } from "lucide-react";
import { Button } from "@repo/ayasofyazilim-ui/components/button";
import * as Table from "@repo/ayasofyazilim-ui/components/table";
import { fieldOptionsByDependency } from "../../utils/dependency";
import { FieldLabel } from "../../custom/label";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";

export const TableArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  const { items, required, canAdd, title, onAddClick, uiSchema, disabled } =
    props;
  const displayName = uiSchema?.["ui:title"] || title;
  const addable = uiSchema?.["ui:options"]?.addable || canAdd;
  const dependencyOptions = fieldOptionsByDependency(
    uiSchema,
    props.formContext,
  );
  const fieldOptions = {
    disabled,
    required,
    ...dependencyOptions,
  };
  if (fieldOptions.hidden) return null;
  return (
    <Table.Table
      wrapperClassName={cn(
        uiSchema?.className?.table?.wrapper,
        uiSchema?.["ui:className"],
      )}
      className={cn(
        "col-span-full table-auto",
        uiSchema?.className?.table.container,
      )}
    >
      <Table.TableCaption className="caption-top mb-2">
        <FieldLabel
          label={displayName}
          required={required}
          id={props.idSchema?.$id}
        />
      </Table.TableCaption>
      <Table.TableHeader>
        <Table.TableRow className="border-x border-t bg-gray-100">
          {props.idSchema &&
            Object.keys(props.idSchema).map((item) => {
              if (item === "$id") return null;
              return (
                <Table.TableHead
                  className="text-nowrap text-xs font-bold p-0"
                  key={item}
                >
                  <div className="flex h-10 items-center justify-center w-full border-r">
                    <FieldLabel
                      label={uiSchema?.items?.[item]?.["ui:title"] || item}
                      id={props.idSchema.$id}
                    />
                  </div>
                </Table.TableHead>
              );
            })}
          <Table.TableHead className="text-nowrap text-xs p-0 w-1">
            {addable && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-transparent rounded-none size-10 border-0 text-black"
                  onClick={onAddClick}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            )}
          </Table.TableHead>
        </Table.TableRow>
      </Table.TableHeader>
      <Table.TableBody className="[&_tr:last-child]:border [&_tr:last-child]:border-t-0">
        {items &&
          items.map((item) => (
            <Table.TableRow
              className="border-0 border-x border-b"
              key={item.key}
            >
              {item.children}
              {(item.hasRemove || item.hasCopy) && (
                <Table.TableCell className="p-0 w-1">
                  <div className="flex bg-border gap-px border-l">
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive rounded-none size-10 border-0"
                      onClick={item.onDropIndexClick(item.index)}
                    >
                      <CircleXIcon className="size-4" />
                    </Button>
                    {item.hasCopy && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-none size-10 border-0"
                        onClick={item.onCopyIndexClick(item.index)}
                      >
                        <Copy className="size-4" />
                      </Button>
                    )}
                  </div>
                </Table.TableCell>
              )}
            </Table.TableRow>
          ))}
      </Table.TableBody>
    </Table.Table>
  );
};
