"use client";

import { Button } from "@repo/ayasofyazilim-ui/components/button";
import { Label } from "@repo/ayasofyazilim-ui/components/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@repo/ayasofyazilim-ui/components/select";
import type { DateSelectType } from "..";

function DateField({
  filter,
  isPending,
}: {
  filter: DateSelectType;
  isPending: boolean;
}) {
  return (
    <div className="grid items-center gap-1.5" key={filter.title}>
      <Label htmlFor="refund-point">{filter.title}</Label>
      <Select
        onValueChange={filter.onChange}
        value={filter.value}
        disabled={isPending}
      >
        <SelectTrigger className="min-h-10">
          <SelectValue placeholder={filter.placeholder || "Select a date"} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{filter.title}</SelectLabel>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
          <Button
            className="w-full px-2"
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              filter.onChange("");
            }}
          >
            Clear
          </Button>
        </SelectContent>
      </Select>
    </div>
  );
}

export default DateField;
