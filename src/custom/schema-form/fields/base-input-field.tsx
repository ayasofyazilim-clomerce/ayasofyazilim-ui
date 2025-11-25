import { Input } from "@repo/ayasofyazilim-ui/components/input";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import {
  ariaDescribedByIds,
  BaseInputTemplateProps,
  examplesId,
  getInputProps,
} from "@rjsf/utils";
import { ChangeEvent, FocusEvent } from "react";

export function BaseInputTemplate({
  id,
  htmlName,
  placeholder,
  required,
  readonly,
  disabled,
  type,
  value,
  onChange,
  onChangeOverride,
  onBlur,
  onFocus,
  autofocus,
  options,
  schema,
  rawErrors = [],
  children,
  extraProps,
  className,
}: BaseInputTemplateProps) {
  const inputProps = {
    ...extraProps,
    ...getInputProps(schema, type, options),
  };
  const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
    onChange(value === "" ? options.emptyValue : value);
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, target && target.value);
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, target && target.value);

  return (
    <>
      <Input
        id={id}
        name={htmlName || id}
        type={type}
        placeholder={placeholder}
        autoFocus={autofocus}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        className={cn(
          { "border-destructive focus-visible:ring-0": rawErrors.length > 0 },
          className
        )}
        list={schema.examples ? examplesId(id) : undefined}
        {...inputProps}
        value={value || value === 0 ? value : ""}
        onChange={onChangeOverride || _onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds(id, !!schema.examples)}
      />
      {children}
      {Array.isArray(schema.examples) ? (
        <datalist id={examplesId(id)}>
          {(schema.examples as string[])
            .concat(
              schema.default && !schema.examples.includes(schema.default)
                ? ([schema.default] as string[])
                : []
            )
            .map((example: any) => {
              return <option key={example} value={example} />;
            })}
        </datalist>
      ) : null}
    </>
  );
}
