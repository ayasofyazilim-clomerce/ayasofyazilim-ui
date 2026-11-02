import { z } from "zod";
import type {
  JSONSchemaProperty,
  MasterDataGridResources,
} from "../custom/master-data-grid/types";
import { createCellValidator } from "../custom/master-data-grid/utils/cell-validation";

// The zod schema the cell renderer built before zod left the grid bundle, kept
// verbatim as the reference the replacement must agree with.
function referenceSchema(
  p: JSONSchemaProperty,
  t?: MasterDataGridResources
): z.ZodType {
  let schema: z.ZodType;
  switch (p.type) {
    case "string":
      schema = z.string({ message: t?.["validation.invalidString"] ?? "validation.invalidString" });
      if (p.minLength !== undefined)
        schema = (schema as z.ZodString).min(
          p.minLength,
          t?.["validation.minLength"]
            ? t["validation.minLength"].replace("{min}", String(p.minLength))
            : `Must be at least ${p.minLength} characters`
        );
      if (p.maxLength !== undefined)
        schema = (schema as z.ZodString).max(
          p.maxLength,
          t?.["validation.maxLength"]
            ? t["validation.maxLength"].replace("{max}", String(p.maxLength))
            : `Must be at most ${p.maxLength} characters`
        );
      if (p.format === "email")
        schema = (schema as z.ZodString).email(
          t?.["validation.invalidEmail"] || "Must be a valid email address"
        );
      if (p.format === "uri" || p.format === "url")
        schema = z.url(t?.["validation.invalidUrl"] || "Must be a valid URL");
      if (p.format === "uuid")
        schema = z.uuid(t?.["validation.invalidUuid"] || "Must be a valid UUID");
      break;
    case "number":
    case "integer": {
      schema = z.number({
        message:
          p.type === "integer"
            ? t?.["validation.invalidInteger"] || "Must be a valid integer"
            : t?.["validation.invalidNumber"] || "Must be a valid number",
      });
      if (p.type === "integer")
        schema = (schema as z.ZodNumber).int(
          t?.["validation.mustBeInteger"] || "Must be an integer"
        );
      if (p.minimum !== undefined)
        schema = (schema as z.ZodNumber).min(
          p.minimum,
          t?.["validation.minValue"]
            ? t["validation.minValue"].replace("{min}", String(p.minimum))
            : `Must be at least ${p.minimum}`
        );
      if (p.maximum !== undefined)
        schema = (schema as z.ZodNumber).max(
          p.maximum,
          t?.["validation.maxValue"]
            ? t["validation.maxValue"].replace("{max}", String(p.maximum))
            : `Must be at most ${p.maximum}`
        );
      break;
    }
    case "boolean":
      schema = z.boolean({ message: t?.["validation.invalidBoolean"] || "Must be true or false" });
      break;
    default:
      schema = z.unknown();
  }
  if (p.enum && Array.isArray(p.enum))
    schema = z.enum(p.enum as [string, ...string[]], t?.["validation.invalidEnum"] || "Invalid value");
  if (!p.required) schema = schema.optional().nullable();
  return schema;
}

const reference = (p: JSONSchemaProperty, t?: MasterDataGridResources) => {
  const schema = referenceSchema(p, t);
  return (value: unknown) => {
    const result = schema.safeParse(value);
    return result.success ? null : result.error.issues[0]?.message || "Invalid value";
  };
};

const required = ["x"];
const properties: JSONSchemaProperty[] = [
  { type: "string" },
  { type: "string", required },
  { type: "string", minLength: 3, maxLength: 5, required },
  { type: "string", format: "email", minLength: 8, required },
  { type: "string", format: "email" },
  { type: "string", format: "url", required },
  { type: "string", format: "uri" },
  { type: "string", format: "uuid", required },
  { type: "number", minimum: 1, maximum: 10, required },
  { type: "number" },
  { type: "integer", minimum: 0, maximum: 100, required },
  { type: "integer" },
  { type: "boolean", required },
  { type: "boolean" },
  { type: "string", enum: ["A", "B"], required },
  { type: "string", enum: ["A", "B"] },
  { type: "array", required },
  { type: "object" },
];

const values: unknown[] = [
  undefined,
  null,
  "",
  "ab",
  "abc",
  "abcdef",
  "  ",
  "a@b.co",
  "first.last@example.com",
  ".lead@example.com",
  "two..dots@example.com",
  "no-at-sign",
  "https://unirefund.com/x?y=1",
  "  https://padded.example  ",
  "not a url",
  "mailto:someone@example.com",
  "123e4567-e89b-12d3-a456-426614174000",
  "00000000-0000-0000-0000-000000000000",
  "123e4567-e89b-92d3-a456-426614174000",
  "A",
  "C",
  0,
  1,
  5.5,
  10,
  11,
  -1,
  2 ** 53,
  Number.NaN,
  Number.POSITIVE_INFINITY,
  true,
  false,
  [],
  {},
];

const resources = {
  "validation.invalidString": "S",
  "validation.minLength": "min {min}",
  "validation.maxLength": "max {max}",
  "validation.invalidEmail": "E",
  "validation.invalidUrl": "U",
  "validation.invalidUuid": "UU",
  "validation.invalidNumber": "N",
  "validation.invalidInteger": "I",
  "validation.mustBeInteger": "MI",
  "validation.minValue": "minv {min}",
  "validation.maxValue": "maxv {max}",
  "validation.invalidBoolean": "B",
  "validation.invalidEnum": "EN",
} as unknown as MasterDataGridResources;

describe("createCellValidator", () => {
  for (const t of [undefined, resources]) {
    for (const property of properties) {
      it(`matches the zod schema for ${JSON.stringify(property)}${t ? " with resources" : ""}`, () => {
        const expected = reference(property, t);
        const actual = createCellValidator(property, t);
        for (const value of values) {
          expect([value, actual(value)]).toEqual([value, expected(value)]);
        }
      });
    }
  }

  it("accepts anything when the column has no schema", () => {
    expect(createCellValidator(undefined)("whatever")).toBeNull();
  });
});
