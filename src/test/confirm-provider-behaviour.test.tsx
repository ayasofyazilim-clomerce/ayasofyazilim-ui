import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ConfirmOptions,
  ConfirmProvider,
  useConfirm,
} from "../custom/confirm-provider";

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

function Harness({ onReady }: { onReady: (confirm: Confirm) => void }) {
  const confirm = useConfirm();
  onReady(confirm);
  return null;
}

function setup(labels?: { confirm?: string; cancel?: string }) {
  const ref: { confirm?: Confirm } = {};
  const view = render(
    <ConfirmProvider labels={labels}>
      <Harness onReady={(c) => (ref.confirm = c)} />
    </ConfirmProvider>
  );
  const ask = (options: ConfirmOptions) => {
    let promise!: Promise<boolean>;
    act(() => {
      promise = ref.confirm!(options);
    });
    return promise;
  };
  return { ...view, ask };
}

describe("useConfirm", () => {
  it("resolves true when the user confirms", async () => {
    const { ask } = setup();
    const result = ask({ title: "Delete?" });
    await userEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await expect(result).resolves.toBe(true);
  });

  it("resolves false when the user cancels", async () => {
    const { ask } = setup();
    const result = ask({ title: "Delete?", description: "Cannot be undone" });
    expect(await screen.findByText("Cannot be undone")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await expect(result).resolves.toBe(false);
  });

  it("resolves false on Escape and starts focus on Cancel", async () => {
    const { ask } = setup();
    const result = ask({ title: "Delete?" });
    const cancel = await screen.findByRole("button", { name: "Cancel" });
    expect(cancel).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect(result).resolves.toBe(false);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("styles the confirm button as destructive for the destructive variant", async () => {
    const { ask } = setup();
    ask({ title: "Delete?", variant: "destructive" });
    const confirm = await screen.findByRole("button", { name: "Confirm" });
    expect(confirm.className).toContain("bg-destructive");
  });

  it("does not style the confirm button as destructive by default", async () => {
    const { ask } = setup();
    ask({ title: "Proceed?" });
    const confirm = await screen.findByRole("button", { name: "Confirm" });
    expect(confirm.className).not.toContain("bg-destructive");
  });

  it("lets per-call labels win over provider labels", async () => {
    const { ask } = setup({ confirm: "Yes", cancel: "No" });
    ask({ title: "Sure?", confirmLabel: "Delete", cancelLabel: "Keep" });
    expect(
      await screen.findByRole("button", { name: "Delete" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep" })).toBeInTheDocument();
  });

  it("lets provider labels win over the defaults", async () => {
    const { ask } = setup({ confirm: "Yes", cancel: "No" });
    ask({ title: "Sure?" });
    expect(await screen.findByRole("button", { name: "Yes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No" })).toBeInTheDocument();
  });

  it("resolves the first request false and shows the second when asked twice", async () => {
    const { ask } = setup();
    const first = ask({ title: "First?" });
    expect(await screen.findByText("First?")).toBeInTheDocument();
    const second = ask({ title: "Second?" });
    await expect(first).resolves.toBe(false);
    expect(await screen.findByText("Second?")).toBeInTheDocument();
    expect(screen.queryByText("First?")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await expect(second).resolves.toBe(true);
  });

  it("resolves a pending request false when the provider unmounts", async () => {
    const { ask, unmount } = setup();
    const result = ask({ title: "Delete?" });
    await screen.findByRole("alertdialog");
    unmount();
    await expect(result).resolves.toBe(false);
  });

  it("throws outside a provider", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Harness onReady={() => {}} />)).toThrow(
      "useConfirm must be used inside <ConfirmProvider>"
    );
    spy.mockRestore();
  });
});
