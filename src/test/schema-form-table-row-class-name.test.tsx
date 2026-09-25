import { render, screen } from "@testing-library/react";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import { SchemaForm } from "../custom/schema-form";

type Tier = { id?: string; maxAmount?: number };
type Values = { tiers: Tier[] };

const schema: RJSFSchema = {
  type: "object",
  properties: {
    tiers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          maxAmount: { type: "number", title: "Max" },
        },
      },
    },
  },
};

function Harness({
  formData,
  disabled,
  uiSchema,
}: {
  formData: Values;
  disabled?: boolean;
  uiSchema?: UiSchema<Values>;
}) {
  return (
    <SchemaForm<Values>
      disabled={disabled}
      formData={formData}
      schema={schema}
      uiSchema={uiSchema}
      useTableForArrayFields
    />
  );
}

function bodyRows(container: HTMLElement) {
  return Array.from(container.querySelectorAll("tbody > tr"));
}

describe("SchemaForm table-mode array rows", () => {
  it("gives a row the class its item asks for", () => {
    const { container } = render(
      <Harness
        formData={{
          tiers: [
            { id: "a", maxAmount: 100 },
            { id: "b", maxAmount: 200 },
          ],
        }}
        uiSchema={{
          tiers: {
            "ui:options": {
              rowClassName: (item: Tier) =>
                item.id === "b" ? "marked" : undefined,
            },
          },
        }}
      />
    );

    const [first, second] = bodyRows(container);
    expect(first).not.toHaveClass("marked");
    expect(second).toHaveClass("marked");
  });

  it("locks a row's remove button on a disabled form", () => {
    render(
      <Harness
        disabled
        formData={{ tiers: [{ maxAmount: 100 }] }}
        uiSchema={{ tiers: { "ui:options": { orderable: false } } }}
      />
    );

    const remove = screen
      .getAllByRole("button")
      .find((button) => button.closest("tbody"));
    expect(remove).toBeDefined();
    expect(remove).toBeDisabled();
  });

  it("leaves the remove button usable on an enabled form", () => {
    render(
      <Harness
        formData={{ tiers: [{ maxAmount: 100 }] }}
        uiSchema={{ tiers: { "ui:options": { orderable: false } } }}
      />
    );

    const remove = screen
      .getAllByRole("button")
      .find((button) => button.closest("tbody"));
    expect(remove).toBeEnabled();
  });
});
