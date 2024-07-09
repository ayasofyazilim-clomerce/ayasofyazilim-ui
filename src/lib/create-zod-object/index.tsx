import { ZodSchema, ZodType, z } from 'zod';

// item & sub item
export type JsonSchema = {
  default?: any;
  description?: string | undefined;
  displayName: string;
  enum?: any;
  format?: 'date-time' | 'email' | 'uuid';
  isReadOnly?: boolean;
  isRequired?: boolean;
  maxLength?: number;
  nullable?: boolean;
  pattern?: RegExp;
  properties?: Record<string, JsonSchema>;
  type:
    | 'string'
    | 'boolean'
    | 'object'
    | 'integer'
    | 'number'
    | 'array'
    | 'toggle'
    | 'select';
};
// group
export type SchemaType = {
  additionalProperties: Boolean;
  displayName: string;
  properties: Record<string, JsonSchema | SchemaType>;
  required: ReadonlyArray<string>;
  type: String;
};

export const isJsonSchema = (object: any): object is JsonSchema =>
  'type' in object;
export const isSchemaType = (object: any): object is SchemaType =>
  'required' in object;

export function createZodObject(
  schema: SchemaType,
  positions: Array<any>,
  convertors?: Record<string, any>
): ZodType {
  const zodSchema: Record<string, ZodSchema> = {};
  positions.forEach((element: string) => {
    const props = schema.properties[element];
    const isRequired = schema.required.includes(element);
    if (isSchemaType(props)) {
      Object.keys(props.properties).map((key) => {
        zodSchema[element] = createZodObject(
          props,
          Object.keys(props.properties)
        );
      });
    } else if (isJsonSchema(props)) {
      let zodType;
      if (convertors && Object.keys(convertors).includes(element)) {
        const newProps = props;
        newProps.enum = convertors[element];
        zodType = createZodType(newProps, isRequired);
      } else {
        zodType = createZodType(props, isRequired);
      }
      zodSchema[element] = zodType;
    }
  });
  return z.object(zodSchema, {
    description: schema.displayName,
  });
}

// TODO: Handle object case and add related data and example is
// $Volo_Abp_Identity_IdentityRoleCreateDto
// const formSchema = z.object({
//     name: z.string().max(256).min(0), // Assuming `name` is optional as it's not in the required list
//     isDefault: z.boolean().optional(),
//     isPublic: z.boolean().optional(),
//     extraProperties: z.object({
//         // Assuming any additional properties are of type `unknown`
//         additionalProperties: z.unknown().optional(),
//         nullable: z.boolean().optional(),
//         readOnly: z.boolean().optional()
//     }).optional().nullable()
// })
function createZodType(
  schema: JsonSchema,
  isRequired: boolean
): ZodSchema<any> {
  let zodType;
  switch (schema?.type) {
    case 'string':
      zodType = z.string({ description: schema.displayName });
      if (schema.maxLength) zodType = zodType.max(schema.maxLength);
      if (schema.pattern) zodType = zodType.regex(schema.pattern);
      if (schema.format === 'email') zodType = zodType.email();
      if (schema.default) zodType = zodType.default(schema.default);
      if (schema.format === 'date-time') zodType = z.coerce.date();
      break;
    case 'select':
      zodType = z.enum(schema.enum);
      if (schema.default) zodType = zodType.default(schema.default);
      break;
    case 'boolean':
      zodType = z.boolean();
      if (schema.default) zodType = zodType.default(schema.default == 'true');
      break;
    case 'integer':
      if (schema.enum) {
        const stringEnums = schema.enum.map((e: any) => e.toString());
        zodType = z.enum(stringEnums as [string, ...string[]]);
        break;
      }
      zodType = z.number().int();
      break;
    case 'integer':
      if (schema.enum) {
        const stringEnums = schema.enum.map((e: any) => e.toString());
        zodType = z.enum(stringEnums as [string, ...string[]]);
        break;
      }
      zodType = z.number().int();
      break;
    default:
      zodType = z.unknown({ description: schema.displayName });
  }
  if (!isRequired) zodType = zodType.optional();
  if (schema.nullable) zodType = zodType.nullable();
  return zodType;
}
