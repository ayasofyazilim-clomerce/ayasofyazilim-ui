import {
  ArrayFieldTemplateItemType,
  ArrayFieldTemplateProps,
} from '@rjsf/utils';
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Plus,
  Trash,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const AccordionArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  const { items, title, required, canAdd, onAddClick, uiSchema, disabled } =
    props;
  const displayName = uiSchema?.['ui:title'] || title;
  const addable = uiSchema?.['ui:options']?.addable || canAdd;
  return (
    <Accordion
      type="single"
      collapsible
      className={cn('w-full group', uiSchema?.['ui:className'])}
      defaultValue={title}
    >
      <AccordionItem
        value={title}
        className="border-0 [&>h3]:sticky [&>h3]:top-0 [&>h3]:z-10"
      >
        <AccordionTrigger
          onClick={(ev) => items.length === 0 && ev.preventDefault()}
          className={cn(
            'flex gap-4 min-h-[54px] overflow-hidden items-center bg-white py-2 px-4 rounded-md border relative group-has-[div>div>div>*]:rounded-b-none hover:no-underline hover:[&>span]:underline hover:bg-zinc-50',
            items.length === 0 && '[&>svg]:hidden pr-2',
            disabled &&
              'cursor-default pointer-events-none hover:[&>span]:no-underline text-muted-foreground opacity-50'
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
                'ml-2 z-10 !no-underline',
                disabled && 'pointer-events-none'
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
            'flex flex-col gap-4 has-[*]:border p-0 has-[*]:p-4 has-[*]:border-t-0 rounded-b-md'
          )}
        >
          {items &&
            items.map((item, index) => (
              <div
                className="flex relative rounded-md border [&>fieldset]:border-none"
                key={item.key}
              >
                {item.children}
                <ArrayToolBar {...item} itemIndex={index} />
              </div>
            ))}
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
        <Button
          variant="outline"
          className="absolute right-2 top-2"
          size="icon"
        >
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
