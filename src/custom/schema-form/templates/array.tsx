import {
  ArrayFieldTemplateItemType,
  ArrayFieldTemplateProps,
} from "@rjsf/utils";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Plus,
  Trash,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ayasofyazilim-ui/components/accordion";
import { Button } from "@repo/ayasofyazilim-ui/components/button";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ayasofyazilim-ui/components/dropdown-menu";
import { fieldOptionsByDependency } from "../utils/dependency";

export const AccordionArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  const { items, title, required, canAdd, onAddClick, uiSchema, disabled } =
    props;
  const displayName = uiSchema?.["ui:title"] || title;
  const addable = uiSchema?.["ui:options"]?.addable || canAdd;
  const dependencyOptions = fieldOptionsByDependency(
    uiSchema,
    props.formContext
  );
  const fieldOptions = {
    disabled,
    required,
    ...dependencyOptions,
  };
  if (fieldOptions.hidden) return null;
  return (
    <Accordion
      type="single"
      collapsible
      className={cn("w-full group", uiSchema?.className?.accordion)}
      defaultValue={title}
    >
      <AccordionItem
        value={title}
        className="border-0 [&>h3]:sticky [&>h3]:top-0 [&>h3]:z-10"
      >
        <AccordionTrigger
          onClick={(ev) => items.length === 0 && ev.preventDefault()}
          className={cn(
            "flex gap-4 min-h-[54px] overflow-hidden items-center bg-white py-2 px-4 rounded-md border relative group-has-[div>div>div>*]:rounded-b-none hover:no-underline hover:[&>span]:underline hover:bg-zinc-50",
            items.length === 0 && "[&>svg]:hidden pr-2",
            disabled &&
              "cursor-default pointer-events-none hover:[&>span]:no-underline text-muted-foreground opacity-50",
            uiSchema?.className?.accordionTrigger
          )}
        >
          {displayName && (
            <span className="w-full text-left">
              {displayName}
              {required && <span className="text-destructive">*</span>}
            </span>
          )}
          {addable && (
            <Button
              disabled={disabled}
              type="button"
              variant="secondary"
              className={cn(
                "ml-2 z-10 no-underline!",
                disabled && "pointer-events-none",
                uiSchema?.className?.accordionAddButton
              )}
              onClick={(ev) => {
                if (disabled) return;
                ev.preventDefault();
                onAddClick();
              }}
              role="button"
              asChild
            >
              <div>
                <Plus className="mr-2" size={16} />
                <span>Add</span>
              </div>
            </Button>
          )}
        </AccordionTrigger>
        <AccordionContent
          className={cn(
            "flex flex-col gap-4 has-[*]:border p-0 has-[*]:p-4 has-[*]:border-t-0 rounded-b-md",
            uiSchema?.className?.accordionContent
          )}
        >
          {items &&
            items.map((item, index) => {
              const { className: itemClassName, uiSchema: itemUiSchema } = item;
              return (
                <div
                  className={cn(
                    "flex relative rounded-md border [&>div]:border-none",
                    itemClassName,
                    itemUiSchema?.["ui:className"]
                  )}
                  key={item.key}
                >
                  {item.children}
                  <ArrayToolBar {...item} itemIndex={index} />
                </div>
              );
            })}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

function ArrayToolBar({
  itemIndex,
  ...props
}: ArrayFieldTemplateItemType & { itemIndex: number }) {
  if (!props.hasMoveDown && !props.hasMoveUp && !props.hasRemove) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="absolute right-0 top-0" size="icon">
          <MoreHorizontal className="w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {props.hasMoveUp && (
          <DropdownMenuItem
            onClick={props.onReorderClick(itemIndex, props.index - 1)}
          >
            <ChevronUp className="size-4 mr-2" /> Move Up
          </DropdownMenuItem>
        )}
        {props.hasMoveDown && (
          <DropdownMenuItem
            onClick={props.onReorderClick(itemIndex, props.index + 1)}
          >
            <ChevronDown className="size-4 mr-2" /> Move Down
          </DropdownMenuItem>
        )}
        {props.hasRemove && (
          <DropdownMenuItem
            className="text-destructive"
            onClick={props.onDropIndexClick(props.index)}
          >
            <Trash className="size-4 mr-2" />
            Delete Item
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
