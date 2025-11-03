"use client";

import { Label } from "@repo/ayasofyazilim-ui/components/label";
import type { AsyncSelectType } from "..";
import AsyncSelect from "../../async-select";

function AsyncSelectField({
  filter,
  isPending,
  searchText,
}: {
  filter: AsyncSelectType;
  isPending: boolean;
  searchText: string;
}) {
  return (
    <div className="grid items-center gap-1.5" key={filter.title}>
      <Label htmlFor="refund-point">{filter.title}</Label>
      <AsyncSelect
        id={filter.id}
        fetchAction={filter.fetchAction}
        onChange={filter.onChange}
        value={filter.value}
        disabled={isPending}
        multiple={filter.multiple}
        closeOnSelect={!filter.multiple}
        searchText={searchText}
      />
    </div>
  );
}

export default AsyncSelectField;
