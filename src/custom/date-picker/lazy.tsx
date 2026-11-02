"use client";

import { type ComponentProps, lazy, Suspense } from "react";
import type { DatePicker, DateRangePicker } from "./index";

// The pickers pull in react-aria-components (~216 KB). The grid and the schema
// form only need it once a date field actually renders, so they load it then
// instead of on every page that shows a grid or a form.
const DatePickerImpl = lazy(() =>
  import("./index").then((m) => ({ default: m.DatePicker }))
);
const DateRangePickerImpl = lazy(() =>
  import("./index").then((m) => ({ default: m.DateRangePicker }))
);

function Placeholder({ label }: { label?: string }) {
  return (
    <div aria-hidden className="space-y-2">
      {label ? (
        <span className="text-sm font-medium text-foreground">{label}</span>
      ) : null}
      <div className="h-9 w-full rounded-md border bg-transparent dark:bg-input/30" />
    </div>
  );
}

export function LazyDatePicker(props: ComponentProps<typeof DatePicker>) {
  return (
    <Suspense fallback={<Placeholder label={props.label} />}>
      <DatePickerImpl {...props} />
    </Suspense>
  );
}

export function LazyDateRangePicker(
  props: ComponentProps<typeof DateRangePicker>
) {
  return (
    <Suspense fallback={<Placeholder label={props.label} />}>
      <DateRangePickerImpl {...props} />
    </Suspense>
  );
}
