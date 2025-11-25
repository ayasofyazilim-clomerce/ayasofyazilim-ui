import { Button } from "@repo/ayasofyazilim-ui/components/button";
import { ButtonGroup } from "@repo/ayasofyazilim-ui/components/button-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ayasofyazilim-ui/components/popover";
import { TableCell, TableRow } from "@repo/ayasofyazilim-ui/components/table";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import {
  ArrayFieldItemTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ClipboardCheck,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

export function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldItemTemplateProps<T, S, F>) {
  const { children, buttonsProps, hasToolbar } = props;
  const {
    hasCopy,
    hasMoveDown,
    hasMoveUp,
    hasRemove,
    onCopyItem,
    onMoveDownItem,
    onMoveUpItem,
    onRemoveItem,
  } = buttonsProps;
  const isMultipleToolbar = hasRemove && (hasCopy || hasMoveDown || hasMoveUp);
  return (
    <TableRow className={cn("divide-x", props.className)} key={props.itemKey}>
      {children}
      <TableCell className="p-0">
        {hasToolbar && hasRemove && !isMultipleToolbar && (
          <Button
            variant="ghost"
            type="button"
            onClick={buttonsProps.onRemoveItem}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
        {hasToolbar && isMultipleToolbar && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" type="button" className="">
                <MoreHorizontal className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 border-0 min-w-max">
              <ButtonGroup>
                {hasCopy && (
                  <Button variant="outline" onClick={onCopyItem}>
                    <ClipboardCheck className="size-4" />
                  </Button>
                )}
                {hasMoveUp && (
                  <Button variant="outline" onClick={onMoveUpItem}>
                    <ArrowUpIcon className="size-4" />
                  </Button>
                )}
                {hasRemove && (
                  <Button variant="outline" onClick={onRemoveItem}>
                    <Trash2 className="size-4" />
                  </Button>
                )}
                {hasMoveDown && (
                  <Button variant="outline" onClick={onMoveDownItem}>
                    <ArrowDownIcon className="size-4" />
                  </Button>
                )}
              </ButtonGroup>
            </PopoverContent>
          </Popover>
        )}
      </TableCell>
    </TableRow>
  );
}
