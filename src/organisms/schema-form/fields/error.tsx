import { ErrorSchema, FieldErrorProps } from '@rjsf/utils';

export const FieldErrorTemplate = (props: FieldErrorProps) =>
  props.errors && (
    <ul className="space-y-1">
      {props.errors.map((error) => (
        <li
          key={error.toString() + Math.random()}
          className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-destructive"
        >
          {error.toString()}
        </li>
      ))}
    </ul>
  );
export const ErrorSchemaTemplate = ({ errorSchema }: ErrorSchema) => {
  if (errorSchema) {
    const errorList = Object.keys(errorSchema).map((index) => {
      const fields = errorSchema[index];
      if (fields) {
        return Object.keys(fields).map((fieldKey) => {
          const errors = fields[fieldKey]?.__errors;
          if (errors) {
            return errors.map((error) => (
              <span className="text-destructive text-xs">{error}</span>
            ));
          }
          return null;
        });
      }
      return null;
    });
    return <div className="flex flex-col">{errorList}</div>;
  }
  return null;
};
