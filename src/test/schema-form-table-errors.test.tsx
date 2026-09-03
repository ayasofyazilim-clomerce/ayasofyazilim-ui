import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RJSFSchema } from "@rjsf/utils";
import { SchemaForm } from "../custom/schema-form";

/**
 * A table-mode array field used to swallow its own validation errors: the
 * FieldTemplate returned the cell before rendering {errors}, and SchemaForm
 * defaults showErrorList to false, so a failed submit surfaced nothing
 * anywhere and the form simply refused to save.
 */
const schema: RJSFSchema = {
  type: "object",
  properties: {
    brackets: {
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

const CELL_ERROR = "highest bracket must stay open";

function Harness({ onSubmit }: { onSubmit?: () => void }) {
  return (
    <SchemaForm<{ brackets: { maxAmount?: number }[] }>
      formData={{ brackets: [{ maxAmount: 100 }] }}
      onSubmit={() => onSubmit?.()}
      schema={schema}
      useTableForArrayFields
      customValidate={(formData, errors) => {
        // Mirrors the franchise fee-bracket rule: a cross-row verdict reported
        // against one row's cell.
        if (formData?.brackets?.[0]?.maxAmount !== undefined) {
          errors.brackets?.[0]?.maxAmount?.addError(CELL_ERROR);
        }
        return errors;
      }}
    />
  );
}

describe("SchemaForm table-mode array field errors", () => {
  it("renders a custom validation error raised against an array item's cell", async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByText(CELL_ERROR)).toBeInTheDocument();
  });

  it("does not submit while that error stands", async () => {
    const onSubmit = jest.fn();
    render(<Harness onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    await screen.findByText(CELL_ERROR);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
