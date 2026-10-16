import { act, fireEvent, render } from "@testing-library/react";
import type { RJSFSchema } from "@rjsf/utils";
import { SchemaForm } from "../custom/schema-form";

/**
 * RJSF re-reads `formData` from props whenever ANY prop changes, so a form
 * seeded through `formData` threw the user's edits away the moment an
 * unrelated prop changed - `disabled={isPending}` flipping on submit is the
 * common case: a save that failed left the form showing the old values.
 * `formData` is a seed: it resets the form only when it genuinely changes.
 */
const schema: RJSFSchema = {
  type: "object",
  properties: { name: { type: "string", title: "Name" } },
};

function nameInput(container: HTMLElement) {
  const input = container.querySelector<HTMLInputElement>("#root_name");
  if (!input) throw new Error("name input not rendered");
  return input;
}

function type(container: HTMLElement, value: string) {
  act(() => {
    fireEvent.change(nameInput(container), { target: { value } });
  });
}

describe("SchemaForm keeps the user's edits", () => {
  it("across an unrelated prop change", () => {
    const seed = { name: "Saved" };
    const { container, rerender } = render(
      <SchemaForm schema={schema} formData={seed} disabled={false} />
    );
    type(container, "Edited");

    rerender(<SchemaForm schema={schema} formData={seed} disabled />);
    expect(nameInput(container).value).toBe("Edited");

    rerender(<SchemaForm schema={schema} formData={seed} disabled={false} />);
    expect(nameInput(container).value).toBe("Edited");
  });

  it("when the seed is a new but equal object on every render", () => {
    const { container, rerender } = render(
      <SchemaForm schema={schema} formData={{ name: "Saved" }} disabled={false} />
    );
    type(container, "Edited");

    rerender(<SchemaForm schema={schema} formData={{ name: "Saved" }} disabled />);
    expect(nameInput(container).value).toBe("Edited");
  });

  it("but still resets when the seed genuinely changes", () => {
    const { container, rerender } = render(
      <SchemaForm schema={schema} formData={{ name: "Saved" }} />
    );
    type(container, "Edited");

    rerender(<SchemaForm schema={schema} formData={{ name: "Reloaded" }} />);
    expect(nameInput(container).value).toBe("Reloaded");
  });

  it("and leaves an unseeded (uncontrolled) form as it was", () => {
    const { container, rerender } = render(
      <SchemaForm schema={schema} disabled={false} />
    );
    type(container, "Typed");

    rerender(<SchemaForm schema={schema} disabled />);
    expect(nameInput(container).value).toBe("Typed");
  });
});
