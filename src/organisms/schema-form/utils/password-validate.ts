import { FormValidation } from '../types';

export function customPasswordValidate<T>({
  formData,
  keyOne,
  keyTwo,
  errorMessage,
  errors,
}: {
  formData: T | undefined;
  keyOne: keyof T;
  keyTwo: keyof T;
  errorMessage: string;
  errors: FormValidation<T>;
}): FormValidation<T> {
  if (!formData) {
    return errors;
  }
  if (formData[keyOne] !== formData[keyTwo] && errors?.[keyTwo]) {
    errors[keyTwo].addError?.(errorMessage);
  }
  return errors;
}
