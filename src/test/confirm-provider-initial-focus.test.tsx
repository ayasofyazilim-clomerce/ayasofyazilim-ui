import { act, render, screen, waitFor } from "@testing-library/react";
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

function setup(initialFocus?: "cancel" | "confirm") {
  const ref: { confirm?: Confirm } = {};
  render(
    <ConfirmProvider initialFocus={initialFocus}>
      <Harness onReady={(c) => (ref.confirm = c)} />
    </ConfirmProvider>
  );
  return (options: ConfirmOptions) => {
    let promise!: Promise<boolean>;
    act(() => {
      promise = ref.confirm!(options);
    });
    return promise;
  };
}

describe("ConfirmOptions.initialFocus", () => {
  it("per-call cancel overrides provider confirm, and the next call follows the provider again", async () => {
    const ask = setup("confirm");
    const first = ask({ title: "One", initialFocus: "cancel" });
    const cancel = await screen.findByRole("button", { name: "Cancel" });
    await waitFor(() => expect(cancel).toHaveFocus());
    await userEvent.click(cancel);
    await expect(first).resolves.toBe(false);
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    );

    const second = ask({ title: "Two" });
    const confirm = await screen.findByRole("button", { name: "Confirm" });
    await waitFor(() => expect(confirm).toHaveFocus());
    await userEvent.click(confirm);
    await expect(second).resolves.toBe(true);
  });

  it("per-call confirm overrides the default provider focus", async () => {
    const ask = setup();
    const result = ask({ title: "One", initialFocus: "confirm" });
    const confirm = await screen.findByRole("button", { name: "Confirm" });
    await waitFor(() => expect(confirm).toHaveFocus());
    await userEvent.click(confirm);
    await expect(result).resolves.toBe(true);
  });

  it("with no option, focus follows the provider", async () => {
    const ask = setup("confirm");
    const result = ask({ title: "One" });
    const confirm = await screen.findByRole("button", { name: "Confirm" });
    await waitFor(() => expect(confirm).toHaveFocus());
    await userEvent.click(confirm);
    await expect(result).resolves.toBe(true);
  });
});
