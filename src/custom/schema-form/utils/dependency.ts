import { filterUndefinedAndEmpty } from ".";
import { FormContext, UiSchema } from "../types";

type Options = {
  hidden: boolean;
  disabled: boolean;
  required: boolean;
};
export function fieldOptionsByDependency<T>(
  uiSchema: UiSchema<T> | undefined,
  formContext: FormContext<T> | undefined,
): Partial<Options> {
  const fieldOptions: Partial<Options> = {};
  if (uiSchema && uiSchema.dependencies && formContext) {
    const { formData } = formContext;
    const onTheFlyOptions: Partial<Options> = {};
    for (const dependency of uiSchema.dependencies) {
      if (formData && dependency.when(formData[dependency.target as keyof T])) {
        if (dependency.type === "DISABLES") {
          Object.assign(onTheFlyOptions, { disabled: true });
        }
        if (dependency.type === "HIDES") {
          Object.assign(onTheFlyOptions, { hidden: true });
        }
        if (dependency.type === "REQUIRES") {
          Object.assign(onTheFlyOptions, { required: true });
        }
      }
      Object.assign(fieldOptions, onTheFlyOptions);
    }
  }
  return filterUndefinedAndEmpty({
    hidden: fieldOptions.hidden,
    disabled: fieldOptions.disabled,
    required: fieldOptions.required,
  });
}
