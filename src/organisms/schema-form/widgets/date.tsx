import { WidgetProps } from '@rjsf/utils';
import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export const CustomDate = (props: WidgetProps) => {
  const { value, uiSchema, onChange, disabled } = props;
  const placeholder = uiSchema?.['ui:placeholder'] || 'Pick a date';
  const [date, setDate] = useState<Date | undefined>(value);
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
        <Calendar
          mode="single"
          selected={date}
          onSelect={(e) => {
            setDate(e);
            onChange(e?.toISOString());
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};
