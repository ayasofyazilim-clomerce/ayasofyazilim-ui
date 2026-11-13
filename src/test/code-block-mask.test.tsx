import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CodeBlock } from "../custom/code-block";

const SECRET = "sk-live-TOPSECRET-9f8e7d";
const BULLETS = "••••••••••••";
const original = Object.getOwnPropertyDescriptor(navigator, "clipboard");

afterEach(() => {
  if (original) Object.defineProperty(navigator, "clipboard", original);
  else delete (navigator as unknown as { clipboard?: unknown }).clipboard;
});

describe("CodeBlock masking", () => {
  it("masked keeps the secret out of the DOM", () => {
    const { container } = render(<CodeBlock code={SECRET} masked />);
    expect(container.innerHTML).not.toContain(SECRET);
    expect(container.textContent).toContain(BULLETS);
  });

  it("reveal shows it, hide removes it again", async () => {
    const user = userEvent.setup();
    const { container } = render(<CodeBlock code={SECRET} masked />);

    await user.click(screen.getByRole("button", { name: "Reveal" }));
    expect(container.textContent).toContain(SECRET);
    expect(container.textContent).not.toContain(BULLETS);

    await user.click(screen.getByRole("button", { name: "Hide" }));
    expect(container.innerHTML).not.toContain(SECRET);
    expect(container.textContent).toContain(BULLETS);
  });

  it("copy while masked copies the secret without revealing it", async () => {
    const user = userEvent.setup();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    const { container } = render(<CodeBlock code={SECRET} masked />);

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(writeText).toHaveBeenCalledWith(SECRET);
    expect(container.innerHTML).not.toContain(SECRET);
  });

  it("renders plain code with data-language when not masked", () => {
    const { container } = render(<CodeBlock code="const a = 1;" language="ts" />);
    expect(container.querySelector("pre code")?.textContent).toBe("const a = 1;");
    expect(container.querySelector("[data-language='ts']")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reveal" })).toBeNull();
  });

  it("labels override", () => {
    render(
      <CodeBlock
        code={SECRET}
        masked
        labels={{ copy: "Kopyala", copied: "Tamam", reveal: "Göster", hide: "Gizle" }}
      />
    );
    expect(screen.getByRole("button", { name: "Kopyala" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Göster" })).toBeTruthy();
  });

  it("hide label applies after reveal", async () => {
    const user = userEvent.setup();
    render(<CodeBlock code={SECRET} masked labels={{ reveal: "Göster", hide: "Gizle" }} />);
    await user.click(screen.getByRole("button", { name: "Göster" }));
    expect(screen.getByRole("button", { name: "Gizle" })).toBeTruthy();
  });
});
