import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  KeyValueEditor,
  createKeyValueRow,
  type KeyValueRow,
} from "../custom/key-value-editor";

function nth<T>(items: T[], index: number): T {
  const item = items[index];
  if (item === undefined) throw new Error(`no item at ${index}`);
  return item;
}

const rows = (): KeyValueRow[] => [
  { id: "a", key: "HOST", value: "localhost" },
  { id: "b", key: "PORT", value: "80" },
];

describe("KeyValueEditor", () => {
  it("createKeyValueRow gives fresh ids and honours init", () => {
    const one = createKeyValueRow({ key: "K", secret: true });
    const two = createKeyValueRow();
    expect(one.id).not.toBe(two.id);
    expect(one).toMatchObject({ key: "K", value: "", secret: true });
    expect(two).toMatchObject({ key: "", value: "" });
  });

  it("Add appends an empty row with a fresh id", async () => {
    const onValueChange = jest.fn();
    render(<KeyValueEditor value={rows()} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    const next = nth(onValueChange.mock.calls as unknown[][], 0)[0] as KeyValueRow[];
    expect(next).toHaveLength(3);
    expect(nth(next, 2)).toMatchObject({ key: "", value: "" });
    expect(["a", "b"]).not.toContain(nth(next, 2).id);
    expect(nth(next, 2).id).toBeTruthy();
  });

  it("Remove drops exactly that row", async () => {
    const onValueChange = jest.fn();
    render(<KeyValueEditor value={rows()} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Remove row 1" }));
    expect(onValueChange).toHaveBeenCalledWith([nth(rows(), 1)]);
  });

  it("editing a key changes only that field and keeps the id", () => {
    const onValueChange = jest.fn();
    render(<KeyValueEditor value={rows()} onValueChange={onValueChange} />);
    fireEvent.change(nth(screen.getAllByLabelText("Key"), 1), {
      target: { value: "PORTS" },
    });
    expect(onValueChange).toHaveBeenCalledWith([
      nth(rows(), 0),
      { id: "b", key: "PORTS", value: "80" },
    ]);
  });

  it("editing a value changes only that field and keeps the id", () => {
    const onValueChange = jest.fn();
    render(<KeyValueEditor value={rows()} onValueChange={onValueChange} />);
    fireEvent.change(nth(screen.getAllByLabelText("Value"), 0), {
      target: { value: "example.com" },
    });
    expect(onValueChange).toHaveBeenCalledWith([
      { id: "a", key: "HOST", value: "example.com" },
      nth(rows(), 1),
    ]);
  });

  it("secret switch toggles the row's secret flag", async () => {
    const onValueChange = jest.fn();
    render(
      <KeyValueEditor value={rows()} onValueChange={onValueChange} allowSecret />
    );
    await userEvent.click(nth(screen.getAllByRole("switch", { name: "Secret" }), 0));
    expect(onValueChange).toHaveBeenCalledWith([
      { ...nth(rows(), 0), secret: true },
      nth(rows(), 1),
    ]);
  });

  it("no secret switch without allowSecret", () => {
    render(<KeyValueEditor value={rows()} onValueChange={jest.fn()} />);
    expect(screen.queryByRole("switch")).toBeNull();
  });

  it("secret rows get a password value input with autofill guards", () => {
    render(
      <KeyValueEditor
        allowSecret
        value={[
          { id: "a", key: "TOKEN", value: "x", secret: true },
          { id: "b", key: "NAME", value: "y" },
        ]}
        onValueChange={jest.fn()}
      />
    );
    const [secret, plain] = screen.getAllByLabelText("Value");
    expect(secret).toHaveAttribute("type", "password");
    expect(secret).toHaveAttribute("autocomplete", "new-password");
    expect(secret).toHaveAttribute("data-1p-ignore");
    expect(secret).toHaveAttribute("data-lpignore");
    expect(plain).not.toHaveAttribute("type", "password");
    expect(plain).toHaveAttribute("autocomplete", "off");
    expect(plain).not.toHaveAttribute("data-1p-ignore");
  });

  it("flags duplicate trimmed keys, linked by aria-describedby", () => {
    render(
      <KeyValueEditor
        value={[
          { id: "a", key: "A", value: "" },
          { id: "b", key: " A ", value: "" },
          { id: "c", key: "B", value: "" },
          { id: "d", key: "", value: "" },
          { id: "e", key: "", value: "" },
        ]}
        onValueChange={jest.fn()}
      />
    );
    const keys = screen.getAllByLabelText("Key");
    expect(nth(keys, 0)).toHaveAttribute("aria-invalid", "true");
    expect(nth(keys, 1)).toHaveAttribute("aria-invalid", "true");
    expect(nth(keys, 2)).not.toHaveAttribute("aria-invalid");
    expect(nth(keys, 3)).not.toHaveAttribute("aria-invalid");
    expect(nth(keys, 4)).not.toHaveAttribute("aria-invalid");
    expect(screen.getAllByText("Duplicate key")).toHaveLength(2);
    const id = nth(keys, 0).getAttribute("aria-describedby")!;
    expect(document.getElementById(id)).toHaveTextContent("Duplicate key");
    expect(nth(keys, 2)).not.toHaveAttribute("aria-describedby");
  });

  it("maxRows disables Add", () => {
    render(
      <KeyValueEditor value={rows()} onValueChange={jest.fn()} maxRows={2} />
    );
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
  });

  it("disabled disables every control", () => {
    render(
      <KeyValueEditor
        value={rows()}
        onValueChange={jest.fn()}
        allowSecret
        disabled
      />
    );
    [
      ...screen.getAllByRole("textbox"),
      ...screen.getAllByRole("switch"),
      ...screen.getAllByRole("button"),
    ].forEach((el) => expect(el).toBeDisabled());
  });

  it("labels override the defaults", () => {
    render(
      <KeyValueEditor
        allowSecret
        value={[{ id: "a", key: "k", value: "v" }]}
        onValueChange={jest.fn()}
        labels={{
          key: "Ad",
          value: "Deger",
          secret: "Gizli",
          add: "Ekle",
          remove: (i) => `Sil ${i + 1}`,
        }}
      />
    );
    expect(screen.getByLabelText("Ad")).toBeInTheDocument();
    expect(screen.getByLabelText("Deger")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Gizli" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ekle" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sil 1" })).toBeInTheDocument();
  });

  it("custom duplicateKey label and classNames apply", () => {
    const { container } = render(
      <KeyValueEditor
        value={[
          { id: "a", key: "A", value: "" },
          { id: "b", key: "A", value: "" },
        ]}
        onValueChange={jest.fn()}
        labels={{ duplicateKey: "Yinelenen" }}
        classNames={{ row: "r-x", key: "k-x", value: "v-x" }}
        className="root-x"
      />
    );
    expect(screen.getAllByText("Yinelenen")).toHaveLength(2);
    expect(container.querySelector(".root-x")).toBeTruthy();
    expect(container.querySelectorAll(".r-x")).toHaveLength(2);
    expect(container.querySelectorAll("input.k-x")).toHaveLength(2);
    expect(container.querySelectorAll("input.v-x")).toHaveLength(2);
  });

  it("createKeyValueRow keeps defaults when init passes explicit undefined", () => {
    const row = createKeyValueRow({ key: undefined, value: undefined });
    expect(row.key).toBe("");
    expect(row.value).toBe("");
  });

  it("an explicit undefined label keeps its English default", () => {
    render(
      <KeyValueEditor
        value={[createKeyValueRow()]}
        onValueChange={() => {}}
        labels={{ add: undefined }}
      />
    );
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });
});
