'use client';

import { CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Button,
  DatePicker as DefaultDatePicker,
  DateRangePicker as DefaultDateRangePicker,
  // Dialog,
  Group,
  Label,
  // Popover,
} from 'react-aria-components';
import { cn } from '@repo/ayasofyazilim-ui/lib/utils';
import { Separator } from '@repo/ayasofyazilim-ui/components/separator';
import { Calendar, RangeCalendar } from './calendar-rac';
import { DateInput, TimeField } from './datefield-rac';
import { DateRange } from './types';
import { createDate, createTime } from './utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ayasofyazilim-ui/components/popover';

// const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; DO NOT DELETE
const offset = new Date().getTimezoneOffset() * 60 * 1000;

export function DatePicker({
  id,
  label,
  classNames,
  onChange,
  defaultValue,
  disabled = false,
  useTime = false,
  showIcon = true,
}: {
  id: string;
  label?: string;
  disabled?: boolean;
  classNames?: {
    dateInput?: string;
  };
  showIcon?: boolean;
  useTime?: boolean;
  defaultValue?: Date;
  onChange?: (date: Date) => void;
}) {
  const [dateValue, setDateValue] = useState(
    createDate({ date: defaultValue, offset })
  );
  const [timeValue, setTimeValue] = useState(
    createTime({ date: defaultValue, offset })
  );
  useEffect(() => {
    if (!dateValue) return;
    if (onChange) {
      if (useTime && timeValue) {
        onChange(
          new Date(
            dateValue.year,
            dateValue.month - 1,
            dateValue.day,
            timeValue.hour,
            timeValue.minute,
            timeValue.second
          )
        );
      } else {
        const timeZone = localStorage.getItem('tenantTimeZone') || 'UTC';

        onChange(dateValue.toDate(timeZone));
      }
    }
  }, [dateValue, timeValue, onChange, useTime]);

  const [isOpen, setIsOpen] = useState(false);
  return (
    <DefaultDatePicker
      aria-label="x"
      className="space-y-2"
      isDisabled={disabled}
      value={dateValue}
      onChange={(date) => {
        if (date) {
          setDateValue(date);
        }
      }}
    >
      {label && (
        <Label className="text-sm font-medium text-foreground">{label}</Label>
      )}

      <div className="flex">
        <Group
          className={cn(
            'w-full flex border rounded-md h-9 pl-3 py-2 items-center gap-2 peer',
            showIcon ? 'pr-9' : 'pr-3',
            classNames?.dateInput
          )}
        >
          <DateInput
            unstyled
            className="peer-focus:ring"
            data-testid={`${id}_calendar_input_1`}
          />
          {useTime && (
            <>
              <Separator orientation="vertical" />
              <TimeField
                aria-label="Time"
                value={timeValue}
                onChange={(time) => {
                  if (time) {
                    setTimeValue(time);
                  }
                }}
              >
                <DateInput
                  unstyled
                  className="peer-focus:ring"
                  data-testid={`${id}_calendar_input_2`}
                />
              </TimeField>
            </>
          )}
        </Group>
        <Popover
          open={isOpen}
          onOpenChange={setIsOpen}
        // placement="bottom end"
        >
          <PopoverTrigger asChild>
            {showIcon && (
              <Button
                data-testid={`${id}_calendar_icon`}
                className="z-10 -me-px -ms-9 flex w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus-visible:outline-none data-focus-visible:outline-2 data-focus-visible:outline-ring/70 border-none"
              >
                <CalendarIcon size={16} strokeWidth={2} />
              </Button>
            )}
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="z-50 min-w-fit max-w-fit rounded-lg border border-border bg-background text-popover-foreground shadow-lg shadow-black/5 outline-none data-entering:animate-in data-exiting:animate-out data-entering:fade-in-0 data-exiting:fade-out-0 data-entering:zoom-in-95 data-exiting:zoom-out-95 data-[placement=bottom]:slide-in-from-top-2 data-[placement=left]:slide-in-from-right-2 data-[placement=right]:slide-in-from-left-2 data-[placement=top]:slide-in-from-bottom-2"
          >
            {/* <Dialog className="max-h-[inherit] overflow-auto p-2"> */}
            <Calendar onChange={() => setIsOpen(false)} />
            {/* </Dialog> */}
          </PopoverContent>
        </Popover>
      </div>
    </DefaultDatePicker>
  );
}

export function DateRangePicker({
  id,
  label,
  classNames,
  onChange,
  defaultValues,
  disabled = false,
  showIcon = true,
}: {
  id: string;
  label?: string;
  disabled?: boolean;
  classNames?: {
    dateInput?: string;
  };
  showIcon?: boolean;
  defaultValues?: DateRange;
  onChange?: (date: DateRange) => void;
}) {
  const [dateValue, setDateValue] = useState({
    start: createDate({ date: defaultValues?.start, offset }),
    end: createDate({ date: defaultValues?.end, offset }),
  });
  useEffect(() => {
    if (!dateValue) return;
    if (onChange) {
      const { start } = dateValue;
      const { end } = dateValue;
      onChange({
        start:
          (start &&
            start.year &&
            start.month &&
            start.day &&
            new Date(start.year, start.month - 1, start.day)) ||
          undefined,
        end:
          (end &&
            end.year &&
            end.month &&
            end.day &&
            new Date(end.year, end.month - 1, end.day)) ||
          undefined,
      });
    }
  }, [dateValue]);
  return (
    <DefaultDateRangePicker
      aria-label="x"
      startName="start"
      endName="end"
      className="space-y-2"
      isDisabled={disabled}
      value={
        dateValue.start &&
        dateValue.end && {
          start: dateValue.start,
          end: dateValue.end,
        }
      }
      onChange={(date) => {
        if (date) {
          setDateValue(date);
        }
      }}
    >
      {label && (
        <Label className="text-sm font-medium text-foreground">{label}</Label>
      )}
      <div className="flex">
        <Group
          className={cn(
            'w-full min-w-fit flex border rounded-md h-9 pl-3 py-2 items-center gap-2 peer',
            showIcon ? 'pr-9' : 'pr-3',
            classNames?.dateInput
          )}
        >
          <DateInput
            unstyled
            className="peer-focus:ring"
            slot="start"
            data-testid={`${id}_calendar_input_2`}
          />
          <Separator orientation="vertical" />
          <DateInput
            unstyled
            className="peer-focus:ring"
            slot="end"
            data-testid={`${id}_calendar_input_2`}
          />
        </Group>
        <Popover>
          <PopoverTrigger asChild>
            {showIcon && (
              <Button
                data-testid={`${id}_calendar_icon`}
                className="z-10 -me-px -ms-9 flex w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus-visible:outline-none data-focus-visible:outline-2 data-focus-visible:outline-ring/70 border-none"
              >
                <CalendarIcon size={16} strokeWidth={2} />
              </Button>
            )}
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="z-50 rounded-lg border border-border bg-background text-popover-foreground shadow-lg shadow-black/5 outline-none data-entering:animate-in data-exiting:animate-out data-entering:fade-in-0 data-exiting:fade-out-0 data-entering:zoom-in-95 data-exiting:zoom-out-95 data-[placement=bottom]:slide-in-from-top-2 data-[placement=left]:slide-in-from-right-2 data-[placement=right]:slide-in-from-left-2 data-[placement=top]:slide-in-from-bottom-2"
          >
            {/* <Dialog className="max-h-[inherit] overflow-auto p-2"> */}
            <RangeCalendar />
            {/* </Dialog> */}
          </PopoverContent>
        </Popover>
      </div>
    </DefaultDateRangePicker>
  );
}
