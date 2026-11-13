import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  LanguageSwitcher,
  type LanguageOption,
} from "../custom/language-switcher";

beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => undefined;
  Element.prototype.releasePointerCapture = () => undefined;
});

const languages: LanguageOption[] = [
  { code: "en", label: "English", flag: <span data-testid="flag-en">EN</span> },
  { code: "tr", label: "Türkçe", flag: <span data-testid="flag-tr">TR</span> },
];

describe("LanguageSwitcher", () => {
  it("shows the label of the current value on the trigger", () => {
    render(
      <LanguageSwitcher languages={languages} value="tr" onValueChange={jest.fn()} />
    );
    const trigger = screen.getByRole("combobox", { name: "Language" });
    expect(trigger).toHaveTextContent("Türkçe");
    expect(within(trigger).getByTestId("flag-tr")).toBeInTheDocument();
  });

  it("calls onValueChange with the chosen code", async () => {
    const onValueChange = jest.fn();
    render(
      <LanguageSwitcher languages={languages} value="tr" onValueChange={onValueChange} />
    );
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(await screen.findByRole("option", { name: /English/ }));
    expect(onValueChange).toHaveBeenCalledWith("en");
  });

  it("renders a flag node inside its option", async () => {
    render(
      <LanguageSwitcher languages={languages} value="tr" onValueChange={jest.fn()} />
    );
    await userEvent.click(screen.getByRole("combobox"));
    const option = await screen.findByRole("option", { name: /English/ });
    expect(within(option).getByTestId("flag-en")).toBeInTheDocument();
  });

  it("renders nothing with fewer than two languages", () => {
    const { container, rerender } = render(
      <LanguageSwitcher languages={[]} value="en" onValueChange={jest.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
    rerender(
      <LanguageSwitcher languages={languages.slice(0, 1)} value="en" onValueChange={jest.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the raw code for an unknown value", () => {
    render(
      <LanguageSwitcher languages={languages} value="xx" onValueChange={jest.fn()} />
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("xx");
  });

  it("uses a custom trigger label and loads no remote assets", async () => {
    const { container } = render(
      <LanguageSwitcher
        languages={languages}
        value="en"
        onValueChange={jest.fn()}
        labels={{ trigger: "Dil" }}
      />
    );
    await userEvent.click(screen.getByRole("combobox", { name: "Dil" }));
    await screen.findByRole("option", { name: /Türkçe/ });
    const withSrc = Array.from(document.body.querySelectorAll("[src]"));
    expect(withSrc.filter((el) => /^http/i.test(el.getAttribute("src") ?? ""))).toHaveLength(0);
    expect(container).toBeDefined();
  });
});
