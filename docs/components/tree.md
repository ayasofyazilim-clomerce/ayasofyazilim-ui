# Tree

`@ayasofyazilim-clomerce/ui/custom/tree` styles a [headless-tree](https://headless-tree.lukasbach.com) tree. It re-exports everything from `@headless-tree/core` and `@headless-tree/react` (`useTree`, the features, `isOrderedDragTarget`, the types) and adds `Tree`, `TreeItem`, `TreeItemLabel`, `TreeDragLine`, `TreeDragHandle` and two drop helpers, `canDropWithinParent` and `reorderTargetWithinParent`.

The file is `"use no memo"`: the headless-tree instance is a mutable object passed as a prop, which the React Compiler must not memoize.

## When to use

- A file-explorer style tree: `TreeItem` with its default click (focus, primary action, open or close a folder) and `TreeItemLabel`.
- An editor tree whose rows are selected by the app rather than toggled by a click, with a grip as the only drag source and drag-and-drop kept among siblings (for example a field schema). Use `clickBehavior="focus"`, `TreeDragHandle` and the sibling-only recipe below.

## Minimal example

```tsx
import {
  Tree,
  TreeItem,
  TreeItemLabel,
  hotkeysCoreFeature,
  syncDataLoaderFeature,
  useTree,
} from "@ayasofyazilim-clomerce/ui/custom/tree";

const tree = useTree<Node>({
  rootItemId: "root",
  getItemName: (item) => item.getItemData().name,
  isItemFolder: (item) => Boolean(item.getItemData().children),
  dataLoader: { getItem: (id) => nodes[id], getChildren: (id) => nodes[id].children ?? [] },
  indent: 20,
  features: [syncDataLoaderFeature, hotkeysCoreFeature],
});

<Tree tree={tree} indent={20}>
  {tree.getItems().map((item) => (
    <TreeItem key={item.getId()} item={item}>
      <TreeItemLabel />
    </TreeItem>
  ))}
</Tree>;
```

## Props

### `Tree`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `tree` | `TreeInstance<T>` | none | The instance from `useTree`. Its container props (`role="tree"`, the keyboard and drop handlers, `position: relative`) are merged onto the element. |
| `indent` | `number` | `20` | Pixels per level, published as `--tree-indent`. |
| `aria-label` | `string` | none | The tree's accessible name. It is handed to `tree.getContainerProps()`, which would otherwise set an empty one over it. |
| other HTML attributes | | | Passed to the element. The container props win, except `className`, which is merged. |

### `TreeItem`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `item` | `ItemInstance<T>` | required | The row's headless-tree item. |
| `asChild` | `boolean` | `false` | Render the single child (Radix Slot) instead of a `<button>`. Needed when the row holds other controls, such as a grip or a twisty button. |
| `clickBehavior` | `"toggle" \| "focus"` | `"toggle"` | See below. |
| other HTML attributes | | | Passed to the row. Who wins against `item.getProps()` depends on `clickBehavior`. |

- **`"toggle"` (default, unchanged):** the row's props are `{ ...yourProps, ...item.getProps() }`. A click focuses the row, runs `onPrimaryAction` and opens or closes a folder. `item.getProps()` wins, so your `onClick`, `aria-selected`, `role`, `tabIndex` and `aria-label` are replaced. Attributes it does not set (`aria-current`, `data-*`) pass through.
- **`"focus"`:** the row's props are `item.getProps()` with its `onClick` replaced by a plain focus (`item.setFocused()` then `tree.updateDomFocus()`), then your props on top, with your `onClick` called after the focus. A click does not open or close a folder and does not run `onPrimaryAction`. Your `aria-selected`, `aria-current` and `data-*` win. Your props win in general, so do not pass `role`, `tabIndex`, `ref` or drag handlers unless you mean to replace headless-tree's.

### `TreeDragHandle`

A `<span role="button">` grip that drags its row.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `item` | `ItemInstance<T>` | required | The row's item. |
| `label` | `string` | required | Accessible name, e.g. `t("Move {0}", name)`. There is no English default: pass a translated string. |
| `disabled` | `boolean` | `false` | No `draggable`, no keyboard drag, `aria-disabled="true"`, out of the tab order. |
| `className` | `string` | none | Merged onto the grip. |
| `title` | `string` | none | A tooltip, e.g. the same translated text as `label`. |
| `aria-describedby` | `string` | none | The id of an element that explains the keyboard move (Enter, the arrow keys, Escape). |
| `children` | `ReactNode` | a vertical grip icon | The grip's content. |

- It spreads `item.getDragHandleProps()` (`draggable`, `onDragStart`, `onDragEnd`), so it is a drag source only when the tree has `seperateDragHandle: true` (otherwise the whole row is one as well).
- **Enter or Space** focuses its item and calls `tree.startKeyboardDrag([item])` (needs `keyboardDragAndDropFeature`). The tree's own keys then move the drop position (Up, Down), drop (Enter) or cancel (Escape). If no valid target exists the half-started drag is stopped. While a drag is running the grip ignores Enter, so the tree's "drop" key gets it.
- It is focusable (`tabIndex={0}`) on every row, unlike the rows' roving `tabIndex`.

### `canDropWithinParent(items, target)`

A `canDrop` for the tree config. True when every dragged item's parent is `target.item`. That accepts the ordered target (a position between two siblings) and the unordered `{ item: parent }` target. headless-tree tests the latter as "can the dragged items become siblings here"; a `canDrop` that rejects it never gets a sibling position offered. False for an empty list, for another parent, and for any target inside a dragged item.

### `reorderTargetWithinParent(items, target)`

For `onDrop`. Returns `{ parentId, insertionIndex }` for an ordered target under the items' own parent, and `null` otherwise (an unordered target, which means a drop onto a row, or another parent). `insertionIndex` is headless-tree's, already adjusted for the moved items: remove them, then insert at that index. The top level's parent is the tree's `rootItemId`.

## Sibling-only drag-and-drop recipe

```tsx
import {
  Tree,
  TreeDragHandle,
  TreeDragLine,
  TreeItem,
  canDropWithinParent,
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  reorderTargetWithinParent,
  syncDataLoaderFeature,
  useTree,
} from "@ayasofyazilim-clomerce/ui/custom/tree";

const tree = useTree<Field>({
  rootItemId: ROOT,
  getItemName: (item) => item.getItemData().key,
  isItemFolder: (item) => item.getItemData().isStructured,
  dataLoader: { getItem, getChildren },
  state: { expandedItems, focusedItem },
  setExpandedItems,
  setFocusedItem,
  indent: 20,
  canDrag: () => !readOnly,
  canDrop: canDropWithinParent,
  openOnDropDelay: 0,
  seperateDragHandle: true,
  onDrop: (items, target) => {
    const move = reorderTargetWithinParent(items, target);
    if (!move) return; // a drop onto a row would otherwise append it
    reorder(move.parentId, items.map((i) => i.getId()), move.insertionIndex);
  },
  features: [
    syncDataLoaderFeature,
    hotkeysCoreFeature,
    dragAndDropFeature,
    keyboardDragAndDropFeature,
  ],
});

useEffect(() => tree.rebuildTree(), [fields, tree]);

<Tree tree={tree} indent={20} aria-label={t("Fields")}>
  {tree.getItems().map((item) => (
    <TreeItem
      key={item.getId()}
      item={item}
      asChild
      clickBehavior="focus"
      aria-selected={item.getId() === selectedId}
      aria-current={item.getId() === selectedId ? "true" : undefined}
      onClick={() => select(item.getId())}
    >
      <div>
        <TreeDragHandle
          item={item}
          label={t("Move {0}", item.getItemName())}
          disabled={readOnly}
        />
        <span>{item.getItemName()}</span>
      </div>
    </TreeItem>
  ))}
  <TreeDragLine />
</Tree>;
```

- `canDrop: canDropWithinParent` keeps every drop position under the dragged items' own parent, for the mouse and the keyboard alike.
- `openOnDropDelay: 0` stops a collapsed sibling folder from opening after 800 ms of hovering over its middle.
- `seperateDragHandle: true` makes the grip the only drag source.
- **Do not add `selectionFeature`.** It brings multi-select (Ctrl/Shift click, Ctrl+A). Keep the selected row in your own state and mark it with `aria-selected` / `aria-current` through `clickBehavior="focus"`. Without the feature a drag moves the grabbed item only.
- Call `tree.rebuildTree()` whenever the data changes: headless-tree caches item metadata.

## Common mistakes

- Using `clickBehavior="focus"` and expecting `onPrimaryAction` to fire on click. It does not; handle the click in `onClick`.
- Passing `aria-selected` to a default (`"toggle"`) row. `item.getProps()` sets `aria-selected="false"` and wins.
- A grip inside a default `<button>` row. Use `asChild` with a `div`: a button cannot hold another control.
- Acting on every `onDrop` target. Only `reorderTargetWithinParent`'s non-null result is a reorder; the unordered parent target `canDropWithinParent` accepts would otherwise move the item to the end.
- Forgetting `keyboardDragAndDropFeature`: the grip then has no keyboard drag.
