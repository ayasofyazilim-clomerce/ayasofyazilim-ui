import { WidgetProps } from '@rjsf/utils';
import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import AdvancedCalendar from '../../../molecules/advanced-calendar';

export const CustomDate = (props: WidgetProps) => {
  const { value, uiSchema, onChange, disabled } = props;
  const uiOptions = uiSchema?.['ui:options'];
  const placeholder =
    uiSchema?.['ui:placeholder']?.toString() ||
    uiOptions?.['ui:placeholder']?.toString() ||
    'Pick a date';
  const [date, setDate] = useState<Date>(value);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal flex',
            !date && 'text-muted-foreground'
          )}
        >
          {date ? format(date, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <AdvancedCalendar
          placeholder={placeholder}
          mode="single"
          presets
          fromYear={
            (uiOptions?.fromYear as number) ||
            new Date(date).getFullYear() - 100
          }
          toYear={
            (uiOptions?.toYear as number) || new Date(date).getFullYear() + 100
          }
          selected={date}
          onSelect={(e) => {
            if (!e) return;
            setDate(e);
            onChange(e.toISOString());
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};
