import { render, screen } from "@testing-library/react";
import type { RJSFSchema } from "@rjsf/utils";
import { SchemaForm } from "../custom/schema-form";
import { CustomSelectableWidget } from "../custom/schema-form/widgets/selectable";

/**
 * The openiddict application edit form feeds SchemaForm the saved application,
 * whose `scopes` is an array of scope names, and renders that field with
 * CustomSelectableWidget. Selectable keeps its selection in internal state, so
 * the widget has to seed it from the RJSF value; otherwise an application that
 * already has scopes opens showing the empty placeholder.
 */
interface Scope {
  name: string;
}

const scopes: Scope[] = [
  { name: "openid" },
  { name: "profile" },
  { name: "IdentityService" },
];

const schema: RJSFSchema = {
  type: "object",
  properties: {
    scopes: {
      uniqueItems: true,
      type: "array",
      title: "Scopes",
      items: { type: "string" },
      nullable: true,
    },
  },
};

function Harness({
  formData,
  defaultValue,
}: {
  formData: object;
  defaultValue?: Scope[];
}) {
  return (
    <SchemaForm
      schema={schema}
      formData={formData}
      uiSchema={{ scopes: { "ui:widget": "Scopes" } }}
      widgets={{
        Scopes: CustomSelectableWidget<Scope>({
          options: scopes,
          getKey: (scope) => scope.name,
          getLabel: (scope) => scope.name,
          defaultValue,
        }),
      }}
    />
  );
}

describe("CustomSelectableWidget seeded from the form value", () => {
  it("renders the values already present in formData", () => {
    render(<Harness formData={{ scopes: ["openid", "profile"] }} />);

    expect(screen.getByText("openid")).toBeInTheDocument();
    expect(screen.getByText("profile")).toBeInTheDocument();
    expect(screen.queryByText("Make a choice...")).not.toBeInTheDocument();
  });

  it("shows the placeholder when the field holds no value", () => {
    render(<Harness formData={{}} />);

    expect(screen.getByText("Make a choice...")).toBeInTheDocument();
  });

  it("keeps an explicitly passed defaultValue", () => {
    render(
      <Harness defaultValue={[{ name: "IdentityService" }]} formData={{}} />
    );

    expect(screen.getByText("IdentityService")).toBeInTheDocument();
  });
});
