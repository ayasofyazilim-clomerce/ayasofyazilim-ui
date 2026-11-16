import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Tree,
  TreeDragHandle,
  TreeItem,
  canDropWithinParent,
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  reorderTargetWithinParent,
  syncDataLoaderFeature,
  useTree,
  type DragTarget,
  type ItemInstance,
  type TreeInstance,
} from "../custom/tree";

type Node = { name: string; children?: string[] };

const DATA: Record<string, Node> = {
  root: { name: "root", children: ["a", "b", "c"] },
  a: { name: "Alpha", children: ["a1", "a2"] },
  a1: { name: "Alpha one" },
  a2: { name: "Alpha two" },
  b: { name: "Beta", children: ["b1"] },
  b1: { name: "Beta one" },
  c: { name: "Gamma" },
};

function node(id: string): Node {
  const found = DATA[id];
  if (!found) throw new Error(`unknown node ${id}`);
  return found;
}

type RowMode = "default" | "focus";

function Harness({
  mode = "default",
  expanded = [],
  onRowClick,
  handleDisabled = false,
  onDrop,
  onTree,
}: {
  mode?: RowMode;
  expanded?: string[];
  onRowClick?: (id: string) => void;
  handleDisabled?: boolean;
  onDrop?: (items: ItemInstance<Node>[], target: DragTarget<Node>) => void;
  onTree?: (tree: TreeInstance<Node>) => void;
}) {
  const tree = useTree<Node>({
    rootItemId: "root",
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => Boolean(item.getItemData().children),
    dataLoader: {
      getItem: (id) => node(id),
      getChildren: (id) => node(id).children ?? [],
    },
    initialState: { expandedItems: expanded },
    indent: 20,
    canDrop: canDropWithinParent,
    onDrop,
    openOnDropDelay: 0,
    seperateDragHandle: true,
    features: [
      syncDataLoaderFeature,
      hotkeysCoreFeature,
      dragAndDropFeature,
      keyboardDragAndDropFeature,
    ],
  });
  onTree?.(tree);

  return (
    <Tree tree={tree} indent={20} aria-label="Fields">
      {tree.getItems().map((item) =>
        mode === "default" ? (
          <TreeItem
            key={item.getId()}
            item={item}
            aria-selected="true"
            onClick={() => onRowClick?.(item.getId())}
          >
            <span>{item.getItemName()}</span>
          </TreeItem>
        ) : (
          <TreeItem
            key={item.getId()}
            item={item}
            asChild
            clickBehavior="focus"
            aria-current={item.getId() === "b" ? "true" : undefined}
            aria-selected={item.getId() === "b" ? "true" : "false"}
            data-row-kind="field"
            onClick={() => onRowClick?.(item.getId())}
          >
            <div>
              <TreeDragHandle
                item={item}
                label={`Move ${item.getItemName()}`}
                disabled={handleDisabled}
              />
              <span>{item.getItemName()}</span>
            </div>
          </TreeItem>
        )
      )}
    </Tree>
  );
}

function row(name: string) {
  return screen.getByRole("treeitem", { name });
}

describe("TreeItem without clickBehavior (unchanged)", () => {
  it("toggles a folder on click and keeps getProps() winning over the caller", async () => {
    const user = userEvent.setup();
    const onRowClick = jest.fn();
    render(<Harness onRowClick={onRowClick} />);

    const beta = row("Beta");
    expect(beta.tagName).toBe("BUTTON");
    expect(beta).toHaveAttribute("aria-expanded", "false");
    // Today the row's own aria-selected and onClick replace the caller's.
    expect(beta).toHaveAttribute("aria-selected", "false");

    await user.click(beta);

    expect(row("Beta")).toHaveAttribute("aria-expanded", "true");
    expect(row("Beta one")).toBeInTheDocument();
    expect(onRowClick).not.toHaveBeenCalled();
  });
});

describe('TreeItem clickBehavior="focus"', () => {
  it("focuses the row without toggling it, then runs the caller's onClick once", async () => {
    const user = userEvent.setup();
    const onRowClick = jest.fn();
    let tree: TreeInstance<Node> | undefined;
    render(
      <Harness
        mode="focus"
        onRowClick={onRowClick}
        onTree={(t) => {
          tree = t;
        }}
      />
    );

    const beta = row("Beta");
    expect(beta.tagName).toBe("DIV");
    expect(beta).toHaveAttribute("aria-current", "true");
    expect(beta).toHaveAttribute("aria-selected", "true");
    expect(beta).toHaveAttribute("data-row-kind", "field");
    expect(row("Alpha")).toHaveAttribute("aria-selected", "false");

    await user.click(beta);

    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith("b");
    expect(tree?.getState().focusedItem).toBe("b");
    expect(tree?.getState().expandedItems).not.toContain("b");
    expect(row("Beta")).toHaveAttribute("aria-expanded", "false");
    expect(row("Beta")).toHaveAttribute("data-focus", "true");
    expect(screen.queryByRole("treeitem", { name: "Beta one" })).toBeNull();
    await waitFor(() => expect(row("Beta")).toHaveFocus());
  });
});

describe("TreeDragHandle", () => {
  it("is a labelled, draggable grip", () => {
    render(<Harness mode="focus" expanded={["a"]} />);

    const grip = screen.getByRole("button", { name: "Move Alpha one" });
    expect(grip.tagName).toBe("SPAN");
    expect(grip).toHaveAttribute("draggable", "true");
    expect(grip).toHaveAttribute("tabindex", "0");
    // seperateDragHandle: the grip is the only drag source, not the row.
    expect(row("Alpha one")).not.toHaveAttribute("draggable");
  });

  it("starts a keyboard drag of its own item on Enter", async () => {
    const user = userEvent.setup();
    let tree: TreeInstance<Node> | undefined;
    render(
      <Harness
        mode="focus"
        expanded={["a"]}
        onTree={(t) => {
          tree = t;
        }}
      />
    );

    screen.getByRole("button", { name: "Move Alpha one" }).focus();
    await user.keyboard("{Enter}");

    expect(tree?.getState().dnd?.draggedItems?.map((i) => i.getId())).toEqual([
      "a1",
    ]);
    expect(tree?.getDragTarget()?.item.getId()).toBe("a");
  });

  it("starts a keyboard drag on Space too", async () => {
    const user = userEvent.setup();
    let tree: TreeInstance<Node> | undefined;
    render(
      <Harness
        mode="focus"
        expanded={["a"]}
        onTree={(t) => {
          tree = t;
        }}
      />
    );

    screen.getByRole("button", { name: "Move Alpha two" }).focus();
    await user.keyboard(" ");

    expect(tree?.getState().dnd?.draggedItems?.map((i) => i.getId())).toEqual([
      "a2",
    ]);
  });

  it("is neither draggable nor keyboard-startable when disabled", async () => {
    const user = userEvent.setup();
    let tree: TreeInstance<Node> | undefined;
    render(
      <Harness
        mode="focus"
        expanded={["a"]}
        handleDisabled
        onTree={(t) => {
          tree = t;
        }}
      />
    );

    const grip = screen.getByRole("button", { name: "Move Alpha one" });
    expect(grip).not.toHaveAttribute("draggable");
    expect(grip).toHaveAttribute("aria-disabled", "true");

    grip.focus();
    await user.keyboard("{Enter}");

    expect(tree?.getState().dnd ?? null).toBeNull();
  });

  it("with canDropWithinParent, a keyboard drag only lands between siblings", async () => {
    const user = userEvent.setup();
    const onDrop = jest.fn();
    render(<Harness mode="focus" expanded={["a", "b"]} onDrop={onDrop} />);

    screen.getByRole("button", { name: "Move Alpha one" }).focus();
    await user.keyboard("{Enter}");
    // Down past Alpha two, then further down: nothing outside "a" is a valid target.
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(onDrop).toHaveBeenCalledTimes(1);
    const [items, target] = onDrop.mock.calls[0] as [
      ItemInstance<Node>[],
      DragTarget<Node>,
    ];
    expect(items.map((i) => i.getId())).toEqual(["a1"]);
    expect(reorderTargetWithinParent(items, target)).toEqual({
      parentId: "a",
      insertionIndex: 1,
    });
  });
});

describe("sibling-only drop helpers", () => {
  function setup() {
    let tree: TreeInstance<Node> | undefined;
    render(
      <Harness
        mode="focus"
        expanded={["a", "b"]}
        onTree={(t) => {
          tree = t;
        }}
      />
    );
    if (!tree) throw new Error("tree not captured");
    const t = tree;
    const item = (id: string) => t.getItemInstance(id);
    const ordered = (
      parentId: string,
      childIndex: number,
      insertionIndex: number
    ): DragTarget<Node> => ({
      item: item(parentId),
      childIndex,
      insertionIndex,
      dragLineIndex: 0,
      dragLineLevel: 0,
    });
    return { item, ordered };
  }

  it("canDropWithinParent accepts the same parent, ordered or not", () => {
    const { item, ordered } = setup();
    const a1 = [item("a1")];

    expect(canDropWithinParent(a1, ordered("a", 2, 1))).toBe(true);
    expect(canDropWithinParent(a1, { item: item("a") })).toBe(true);
    expect(
      canDropWithinParent([item("a1"), item("a2")], ordered("a", 0, 0))
    ).toBe(true);
    // Top-level rows share the root as their parent.
    expect(canDropWithinParent([item("c")], ordered("root", 0, 0))).toBe(true);
  });

  it("canDropWithinParent rejects another parent and a target inside the dragged item", () => {
    const { item, ordered } = setup();

    expect(canDropWithinParent([item("a1")], ordered("b", 0, 0))).toBe(false);
    expect(canDropWithinParent([item("a1")], { item: item("b") })).toBe(false);
    expect(canDropWithinParent([item("a1")], { item: item("a2") })).toBe(false);
    expect(canDropWithinParent([item("a")], ordered("a", 0, 0))).toBe(false);
    expect(canDropWithinParent([item("a")], { item: item("a1") })).toBe(false);
    expect(
      canDropWithinParent([item("a1"), item("b1")], ordered("a", 0, 0))
    ).toBe(false);
    expect(canDropWithinParent([], ordered("a", 0, 0))).toBe(false);
  });

  it("reorderTargetWithinParent returns the parent and insertion index for an ordered same-parent target", () => {
    const { item, ordered } = setup();

    expect(reorderTargetWithinParent([item("a2")], ordered("a", 0, 0))).toEqual(
      { parentId: "a", insertionIndex: 0 }
    );
    expect(
      reorderTargetWithinParent([item("c")], ordered("root", 1, 1))
    ).toEqual({ parentId: "root", insertionIndex: 1 });
  });

  it("reorderTargetWithinParent returns null otherwise", () => {
    const { item, ordered } = setup();

    expect(reorderTargetWithinParent([item("a1")], { item: item("a") })).toBe(
      null
    );
    expect(reorderTargetWithinParent([item("a1")], ordered("b", 0, 0))).toBe(
      null
    );
    expect(reorderTargetWithinParent([item("a")], ordered("a", 0, 0))).toBe(
      null
    );
  });
});
