import { WidgetProps } from '@rjsf/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export const CustomCheckbox = (props: WidgetProps) => (
  <div className="flex items-center gap-2 h-9">
    <Checkbox
      id={props.id}
      className={props.className}
      onCheckedChange={() => {
        props.onChange(!props.value);
      }}
      checked={props.value}
      defaultValue={props.value || props.defaultValue}
      name={props.name}
      disabled={props.disabled}
    />
    <Label htmlFor={props.id}>{props.label}</Label>
  </div>
);
