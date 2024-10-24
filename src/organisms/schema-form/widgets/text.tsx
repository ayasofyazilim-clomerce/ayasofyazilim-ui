import { WidgetProps } from '@rjsf/utils';
import { Input } from '@/components/ui/input';

export const CustomTextInput = (props: WidgetProps) => {
  const { uiSchema, required, className, id, disabled, onChange, value } =
    props;
  const uiOptions = uiSchema?.['ui:options'];
  return (
    <Input
      type={uiOptions?.inputType || 'text'}
      id={id}
      className={className}
      required={required}
      onChange={(event) => onChange(event.target.value)}
      defaultValue={value || props.defaultValue}
      readOnly={props.readOnly}
      disabled={disabled}
    />
  );
};
