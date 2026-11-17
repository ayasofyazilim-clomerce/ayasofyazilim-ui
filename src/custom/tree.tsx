"use client";
"use no memo";

import * as React from "react";
import {
  DragTarget,
  ItemInstance,
  isOrderedDragTarget,
} from "@headless-tree/core";
import { ChevronDownIcon, GripVerticalIcon } from "lucide-react";
import { Slot } from "radix-ui";
export * from "@headless-tree/core";
export * from "@headless-tree/react";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface TreeContextValue<T = any> {
  indent: number;
  currentItem?: ItemInstance<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tree?: any;
}

const TreeContext = React.createContext<TreeContextValue>({
  indent: 20,
  currentItem: undefined,
  tree: undefined,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useTreeContext<T = any>() {
  return React.useContext(TreeContext) as TreeContextValue<T>;
}

interface TreeProps extends React.HTMLAttributes<HTMLDivElement> {
  indent?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tree?: any;
}

function Tree({ indent = 20, tree, className, ...props }: TreeProps) {
  // headless-tree sets the container's aria-label from its argument ("" without one), which would
  // otherwise replace the caller's aria-label.
  const containerProps =
    tree && typeof tree.getContainerProps === "function"
      ? tree.getContainerProps(props["aria-label"])
      : {};
  const mergedProps = { ...props, ...containerProps };

  // Extract style from mergedProps to merge with our custom styles
  const { style: propStyle, ...otherProps } = mergedProps;

  // Merge styles
  const mergedStyle = {
    ...propStyle,
    "--tree-indent": `${indent}px`,
  } as React.CSSProperties;

  return (
    <TreeContext.Provider value={{ indent, tree }}>
      <div
        data-slot="tree"
        style={mergedStyle}
        className={cn("flex flex-col", className)}
        {...otherProps}
      />
    </TreeContext.Provider>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface TreeItemProps<T = any>
  extends React.HTMLAttributes<HTMLButtonElement> {
  item: ItemInstance<T>;
  indent?: number;
  asChild?: boolean;
  /**
   * What a click on the row does.
   * - `"toggle"` (default): headless-tree's own click, which focuses the row,
   *   runs `onPrimaryAction` and opens or closes a folder. `item.getProps()`
   *   wins over the caller's props, as it always has.
   * - `"focus"`: the click only focuses the row, then the caller's `onClick`
   *   runs. The caller's props (`aria-selected`, `aria-current`, `data-*`, ...)
   *   win over `item.getProps()`.
   */
  clickBehavior?: "toggle" | "focus";
}

/**
 * The row props for `clickBehavior="focus"`: `item.getProps()` with its click
 * replaced by a plain focus, then the caller's props on top, with the caller's
 * `onClick` chained after the focus.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function focusOnlyRowProps<T = any>(
  item: ItemInstance<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemProps: Record<string, any>,
  props: React.HTMLAttributes<HTMLButtonElement>
) {
  const { onClick: callerOnClick, ...callerProps } = props;
  return {
    ...itemProps,
    // Caller props win over getProps(), even an explicit undefined, role, tabIndex or ref.
    ...callerProps,
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      item.setFocused();
      item.getTree().updateDomFocus();
      callerOnClick?.(event);
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TreeItem<T = any>({
  item,
  className,
  asChild,
  children,
  clickBehavior = "toggle",
  ...props
}: Omit<TreeItemProps<T>, "indent">) {
  const { indent } = useTreeContext<T>();

  const itemProps = typeof item.getProps === "function" ? item.getProps() : {};
  const mergedProps =
    clickBehavior === "focus"
      ? focusOnlyRowProps(item, itemProps, props)
      : { ...props, ...itemProps };

  // Extract style from mergedProps to merge with our custom styles
  const { style: propStyle, ...otherProps } = mergedProps;

  // Merge styles
  const mergedStyle = {
    ...propStyle,
    "--tree-padding": `${item.getItemMeta().level * indent}px`,
  } as React.CSSProperties;

  const Comp = asChild ? Slot.Root : "button";

  return (
    <TreeContext.Provider value={{ indent, currentItem: item }}>
      <Comp
        data-slot="tree-item"
        style={mergedStyle}
        className={cn(
          "z-10 ps-(--tree-padding) outline-hidden select-none not-last:pb-0.5 focus:z-20 data-disabled:pointer-events-none data-disabled:opacity-50",
          className
        )}
        data-focus={
          typeof item.isFocused === "function"
            ? item.isFocused() || false
            : undefined
        }
        data-folder={
          typeof item.isFolder === "function"
            ? item.isFolder() || false
            : undefined
        }
        data-selected={
          typeof item.isSelected === "function"
            ? item.isSelected() || false
            : undefined
        }
        data-drag-target={
          typeof item.isDragTarget === "function"
            ? item.isDragTarget() || false
            : undefined
        }
        data-search-match={
          typeof item.isMatchingSearch === "function"
            ? item.isMatchingSearch() || false
            : undefined
        }
        aria-expanded={item.isExpanded()}
        {...otherProps}
      >
        {children}
      </Comp>
    </TreeContext.Provider>
  );
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface TreeItemLabelProps<T = any>
  extends React.HTMLAttributes<HTMLSpanElement> {
  item?: ItemInstance<T>;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TreeItemLabel<T = any>({
  item: propItem,
  children,
  className,
  ...props
}: TreeItemLabelProps<T>) {
  const { currentItem } = useTreeContext<T>();
  const item = propItem || currentItem;

  if (!item) {
    console.warn("TreeItemLabel: No item provided via props or context");
    return null;
  }

  return (
    <span
      data-slot="tree-item-label"
      className={cn(
        "flex items-center gap-1 rounded-sm bg-background px-2 py-1.5 text-sm transition-colors not-in-data-[folder=true]:ps-7 hover:bg-accent in-focus-visible:ring-[3px] in-focus-visible:ring-ring/50 in-data-[drag-target=true]:bg-accent in-data-[search-match=true]:bg-blue-400/20! in-data-[selected=true]:bg-accent in-data-[selected=true]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      {item.isFolder() && (
        <ChevronDownIcon className="size-4 text-muted-foreground in-aria-[expanded=false]:-rotate-90" />
      )}
      {children ||
        (typeof item.getItemName === "function" ? item.getItemName() : null)}
    </span>
  );
}

function TreeDragLine({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { tree } = useTreeContext();

  if (!tree || typeof tree.getDragLineStyle !== "function") {
    console.warn(
      "TreeDragLine: No tree provided via context or tree does not have getDragLineStyle method"
    );
    return null;
  }

  const dragLine = tree.getDragLineStyle();
  return (
    <div
      style={dragLine}
      className={cn(
        "absolute z-30 -mt-px h-0.5 w-[unset] bg-primary before:absolute before:-top-[3px] before:left-0 before:size-2 before:rounded-full before:border-2 before:border-primary before:bg-background",
        className
      )}
      {...props}
    />
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface TreeDragHandleProps<T = any> {
  item: ItemInstance<T>;
  /** Accessible name of the grip, e.g. "Move Invoice number". */
  label: string;
  /** Not draggable and no keyboard drag. */
  disabled?: boolean;
  className?: string;
  /** A tooltip for the grip, e.g. the same text as `label`. */
  title?: string;
  /** The id of an element that describes how to move a row with the keyboard. */
  "aria-describedby"?: string;
  /** The grip's content; a vertical grip icon by default. */
  children?: React.ReactNode;
}

/**
 * A grip that drags its row. Pair it with `seperateDragHandle: true` on the
 * tree, so the grip and not the whole row is the drag source. Enter or Space
 * on the grip starts a keyboard drag of its item (needs
 * `keyboardDragAndDropFeature`); the tree's own keys then move (Up, Down),
 * drop (Enter) or cancel (Escape) it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TreeDragHandle<T = any>({
  item,
  label,
  disabled = false,
  className,
  title,
  "aria-describedby": describedBy,
  children,
}: TreeDragHandleProps<T>) {
  const handleProps =
    !disabled && typeof item.getDragHandleProps === "function"
      ? item.getDragHandleProps()
      : {};

  const onKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (disabled || (event.key !== "Enter" && event.key !== " ")) return;
    const tree = item.getTree();
    // While a drag runs, Enter belongs to the tree's own "drop" hotkey.
    if (tree.getState().dnd) return;
    event.preventDefault();
    event.stopPropagation();
    // The keyboard drag searches for its first target from the focused row.
    item.setFocused();
    tree.startKeyboardDrag?.([item]);
    // No valid target: do not leave a half-started drag behind.
    if (tree.getState().dnd && !tree.getDragTarget?.()) {
      tree.stopKeyboardDrag?.();
    }
  };

  return (
    <span
      data-slot="tree-drag-handle"
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-describedby={describedBy}
      title={title}
      aria-disabled={disabled || undefined}
      data-disabled={disabled || undefined}
      className={cn(
        "inline-flex shrink-0 cursor-grab items-center justify-center rounded-sm text-muted-foreground outline-hidden hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing data-disabled:cursor-default data-disabled:opacity-50",
        className
      )}
      {...handleProps}
      onKeyDown={onKeyDown}
    >
      {children ?? <GripVerticalIcon aria-hidden="true" className="size-4" />}
    </span>
  );
}

/**
 * A `canDrop` that keeps a drag inside its own parent: true when every dragged
 * item's parent is the target's item. That covers both the ordered target
 * (between two siblings) and the unordered `{ item: parent }` target that
 * headless-tree tests as "can become a sibling", which must be accepted or no
 * sibling position is ever offered.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function canDropWithinParent<T = any>(
  items: ItemInstance<T>[],
  target: DragTarget<T>
): boolean {
  if (items.length === 0) return false;
  const parentId = target.item.getId();
  return items.every((item) => item.getParent()?.getId() === parentId);
}

/**
 * For an `onDrop`: the parent id and the insertion index (already adjusted for
 * the moved items) of a reorder among siblings, or null for an unordered
 * target (a drop onto a row) or a target under another parent.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reorderTargetWithinParent<T = any>(
  items: ItemInstance<T>[],
  target: DragTarget<T>
): { parentId: string; insertionIndex: number } | null {
  if (!isOrderedDragTarget(target) || !("insertionIndex" in target)) {
    return null;
  }
  if (!canDropWithinParent(items, target)) return null;
  return {
    parentId: target.item.getId(),
    insertionIndex: target.insertionIndex,
  };
}

export {
  Tree,
  TreeItem,
  TreeItemLabel,
  TreeDragLine,
  TreeDragHandle,
  canDropWithinParent,
  reorderTargetWithinParent,
};
export type { TreeItemProps, TreeDragHandleProps };
