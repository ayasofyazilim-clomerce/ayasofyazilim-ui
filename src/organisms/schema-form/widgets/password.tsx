import { WidgetProps } from '@rjsf/utils';
import { PasswordInput } from '../../../molecules/password-input';

export const PasswordInputWidget = (props: WidgetProps) => (
  <PasswordInput
    id={props.id}
    className={props.className}
    required={props.required}
    onChange={(event) => props.onChange(event.target.value)}
    defaultValue={props.value || props.defaultValue}
    readOnly={props.readOnly}
    disabled={props.disabled}
  />
);
