import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Combobox } from "../custom/combobox";

jest.mock("../hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

type Model = { id: string; name: string };

const models: Model[] = [
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "claude", name: "Claude" },
];

async function openAndType(text: string) {
  await userEvent.click(screen.getByRole("combobox"));
  await userEvent.type(await screen.findByPlaceholderText("Search..."), text);
}

function renderCombobox(
  props: Partial<React.ComponentProps<typeof Combobox<Model>>> = {}
) {
  const onValueChange = jest.fn();
  render(
    <Combobox<Model>
      list={models}
      selectIdentifier="id"
      selectLabel="name"
      onValueChange={onValueChange}
      {...props}
    />
  );
  return onValueChange;
}

describe("Combobox freeText", () => {
  it("without freeText the list is unchanged", async () => {
    renderCombobox();
    await openAndType("zzz");
    expect(screen.getByText("0 search result.")).toBeInTheDocument();
    expect(screen.queryByText(/^Use "/)).not.toBeInTheDocument();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("offers the trimmed text as an extra option and selects it", async () => {
    const onValueChange = renderCombobox({
      freeText: { toItem: (text) => ({ id: text, name: text }) },
    });
    await openAndType(" gpt-x ");
    const option = await screen.findByRole("option", { name: 'Use "gpt-x"' });
    await userEvent.click(option);
    expect(onValueChange).toHaveBeenCalledWith({ id: "gpt-x", name: "gpt-x" });
    expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();
  });

  it("does not duplicate a real item whose label differs only in case", async () => {
    renderCombobox({
      freeText: { toItem: (text) => ({ id: text, name: text }) },
    });
    await openAndType("claude");
    expect(screen.queryByText(/^Use "/)).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Claude" })).toBeInTheDocument();
  });

  it("does not duplicate a real item matched by identifier", async () => {
    renderCombobox({
      freeText: { toItem: (text) => ({ id: text, name: text }) },
    });
    await openAndType("gpt-4o");
    expect(screen.queryByText(/^Use "/)).not.toBeInTheDocument();
  });

  it("shows no option for whitespace-only input", async () => {
    renderCombobox({
      freeText: { toItem: (text) => ({ id: text, name: text }) },
    });
    await openAndType("   ");
    expect(screen.queryByText(/^Use "/)).not.toBeInTheDocument();
  });

  it("uses a custom label function", async () => {
    renderCombobox({
      freeText: {
        toItem: (text) => ({ id: text, name: text }),
        label: (text) => `Custom: ${text}`,
      },
    });
    await openAndType("foo");
    expect(
      await screen.findByRole("option", { name: "Custom: foo" })
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Use "/)).not.toBeInTheDocument();
  });

  it("shows a free-text value's own label in the trigger when it is not in the list", () => {
    renderCombobox({
      value: { id: "gpt-x", name: "gpt-x" },
      freeText: { toItem: (text) => ({ id: text, name: text }) },
    });
    expect(screen.getByRole("combobox")).toHaveTextContent("gpt-x");
  });

  it("without freeText an unlisted value still shows the empty label", () => {
    renderCombobox({ value: { id: "gpt-x", name: "gpt-x" } });
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("Please select");
    expect(trigger).not.toHaveTextContent("gpt-x");
  });
});
