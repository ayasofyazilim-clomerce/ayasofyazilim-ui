import { WidgetProps } from '@rjsf/utils';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export const CustomSwitch = (props: WidgetProps) => (
  <div className="flex items-center gap-2 h-9">
    <Switch
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
