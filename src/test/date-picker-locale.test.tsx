import React from "react";
import { render } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";
import { DatePicker, DateRangePicker } from "../custom/date-picker";

const date = new Date(2026, 8, 29, 8, 11);

const firstSegmentType = (container: HTMLElement) =>
  container
    .querySelector('[data-type]:not([data-type="literal"])')
    ?.getAttribute("data-type");

describe("DatePicker locale", () => {
  it("inherits the nearest I18nProvider when no locale is passed", () => {
    const { container } = render(
      <I18nProvider locale="tr-TR">
        <DatePicker id="p" defaultValue={date} />
      </I18nProvider>
    );
    expect(firstSegmentType(container)).toBe("day");
  });

  it("lets an explicit locale win over the provider", () => {
    const { container } = render(
      <I18nProvider locale="tr-TR">
        <DatePicker id="p" locale="en-US" defaultValue={date} />
      </I18nProvider>
    );
    expect(firstSegmentType(container)).toBe("month");
  });

  it("shows no AM/PM under an inherited 24-hour locale", () => {
    const { container } = render(
      <I18nProvider locale="en-GB">
        <DatePicker id="p" useTime defaultValue={date} />
      </I18nProvider>
    );
    expect(container.querySelector('[data-type="hour"]')).not.toBeNull();
    expect(container.querySelector('[data-type="dayPeriod"]')).toBeNull();
  });

  it("inherits for the range picker too", () => {
    const { container } = render(
      <I18nProvider locale="tr-TR">
        <DateRangePicker id="r" defaultValues={{ start: date, end: date }} />
      </I18nProvider>
    );
    expect(firstSegmentType(container)).toBe("day");
  });
});
