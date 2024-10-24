import { WidgetProps } from '@rjsf/utils';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export const CustomSelect = (props: WidgetProps) => {
  const hasValue = props.value || props.defaultValue;
  return (
    <Select
      defaultValue={props.value || props.defaultValue}
      value={props.value || props.defaultValue}
      onValueChange={(value) => {
        props.onChange(value);
      }}
    >
      <SelectTrigger
        className={hasValue ? '' : 'text-muted-foreground'}
        disabled={props.disabled}
      >
        <SelectValue
          placeholder={
            props?.uiSchema?.['ui:placeholder'] ||
            `Please select an ${props.label.toLocaleLowerCase()}`
          }
        />
      </SelectTrigger>
      <SelectContent>
        {props.options.enumOptions?.map((enumOption) => (
          <SelectItem
            key={JSON.stringify(enumOption.value)}
            value={enumOption.value}
          >
            {enumOption.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
