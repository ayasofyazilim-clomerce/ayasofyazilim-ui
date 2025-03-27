'use client';

import { Label } from '@/components/ui/label';

import { MultiSelect } from '../../multi-select';
import type { MultiSelectType } from '..';

function MultiSelectField({
  filter,
  isPending,
}: {
  filter: MultiSelectType;
  isPending: boolean;
}) {
  return (
    <div className="grid items-center gap-1.5" key={filter.title}>
      <Label htmlFor="refund-point">{filter.title}</Label>
      <MultiSelect
        onValueChange={filter.onChange}
        options={filter.options}
        defaultValue={filter.value}
        disabled={isPending}
      />
    </div>
  );
}

export default MultiSelectField;
