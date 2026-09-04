import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RJSFSchema } from "@rjsf/utils";
import { SchemaForm } from "../custom/schema-form";

/**
 * transformErrors suppresses minLength/format/pattern errors while a field is
 * empty, so an untouched field is not nagged about. It used to read that value
 * from the formData prop, which is the initial seed and never changes - so a
 * field seeded "" counted as empty for the life of the form and never reported
 * those errors at all, no matter what was typed into it.
 *
 * That is how the traveller create-document dialog POSTed an empty
 * travellerDocumentNumber: seeded "", minLength: 1 suppressed, required
 * satisfied by the present-but-empty key, so nothing was reported.
 */
const schema: RJSFSchema = {
  type: "object",
  required: ["documentNumber"],
  properties: {
    documentNumber: { type: "string", minLength: 4, title: "Document number" },
    contactEmail: { type: "string", format: "email", title: "Contact email" },
  },
};

function Harness({
  seed,
  onSubmit,
}: {
  seed: object;
  onSubmit: (d: unknown) => void;
}) {
  return (
    <SchemaForm
      schema={schema}
      formData={seed}
      onSubmit={({ formData }) => {
        onSubmit(formData);
      }}
    />
  );
}

const submit = () =>
  userEvent.click(screen.getByRole("button", { name: /submit/i }));

describe("SchemaForm validation against the live form value", () => {
  it("reports minLength on a field that was seeded empty and then typed into", async () => {
    const onSubmit = jest.fn();
    render(<Harness onSubmit={onSubmit} seed={{ documentNumber: "" }} />);

    await userEvent.type(screen.getByLabelText(/document number/i), "ab");
    await submit();

    expect(
      await screen.findByText(/fewer than 4 characters/i)
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("reports format on a field that was seeded empty and then typed into", async () => {
    const onSubmit = jest.fn();
    render(
      <Harness
        onSubmit={onSubmit}
        seed={{ documentNumber: "abcd", contactEmail: "" }}
      />
    );

    await userEvent.type(
      screen.getByLabelText(/contact email/i),
      "not-an-email"
    );
    await submit();

    expect(await screen.findByText(/must match format/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("still suppresses those errors while the field is genuinely empty", async () => {
    const onSubmit = jest.fn();
    render(
      <Harness
        onSubmit={onSubmit}
        seed={{ documentNumber: "abcd", contactEmail: "" }}
      />
    );

    await submit();

    // An untouched optional email must not be nagged about its format.
    expect(screen.queryByText(/must match format/i)).not.toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalled();
  });

  it("keeps typed values when the parent re-renders with a fresh formData literal", async () => {
    const onSubmit = jest.fn();
    // Mirrors real callers: formData is an inline literal, so it is a new
    // object identity on every parent render.
    const Parent = () => <Harness onSubmit={onSubmit} seed={{ documentNumber: "" }} />;
    const { rerender } = render(<Parent />);

    await userEvent.type(screen.getByLabelText(/document number/i), "abcd");
    rerender(<Parent />);
    await submit();

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ documentNumber: "abcd" })
    );
  });
});
