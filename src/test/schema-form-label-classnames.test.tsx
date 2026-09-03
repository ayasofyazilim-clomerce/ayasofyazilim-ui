import { render } from "@testing-library/react";
import type { RJSFSchema } from "@rjsf/utils";
import { SchemaForm } from "../custom/schema-form";

/**
 * FieldTemplate used to spread a field's own label into its class list, so any
 * label containing a Tailwind utility word silently applied it. "Fallback
 * fixed fee" became `fixed`, giving the field position: fixed and stacking it
 * on top of the first field in the form.
 */
const schema: RJSFSchema = {
  type: "object",
  properties: {
    fallbackFixedFee: { type: "number", title: "Fallback fixed fee" },
    hiddenChargeBlock: { type: "number", title: "Hidden charge block" },
    plain: { type: "number", title: "Minimum commission" },
  },
};

function fieldOf(container: HTMLElement, title: string) {
  return [...container.querySelectorAll<HTMLElement>(".rjsf-field")].find(
    (el) => (el.querySelector("label")?.textContent || "").includes(title)
  );
}

describe("SchemaForm field class names", () => {
  it("keeps a label's words out of the field's class list", () => {
    const { container } = render(<SchemaForm schema={schema} />);

    for (const title of ["Fallback fixed fee", "Hidden charge block"]) {
      const field = fieldOf(container, title);
      expect(field).toBeDefined();
      const classes = (field?.className || "").split(/\s+/);
      // the words that would collide with Tailwind utilities
      for (const word of ["fixed", "hidden", "block"]) {
        expect(classes).not.toContain(word);
      }
    }
  });

  it("still emits the rjsf hook classes", () => {
    const { container } = render(<SchemaForm schema={schema} />);
    const field = fieldOf(container, "Minimum commission");
    expect(field?.className).toContain("rjsf-field");
    expect(field?.className).toContain("rjsf-field-number");
  });
});
