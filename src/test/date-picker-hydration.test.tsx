import React from "react";
import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { DatePicker } from "../custom/date-picker";

const SEGMENT = /data-type="(year|month|day|hour|minute|dayPeriod|literal)"/;

// Node's ICU and the browser's disagree on formatted output (en-US puts
// U+202F before AM on Node, U+0020 in Chrome; en-JP resolves differently),
// so no segment text may be rendered on the server for any locale.
const picker = (locale: string) => (
  <DatePicker
    id="probe"
    useTime
    locale={locale}
    defaultValue={new Date(2026, 8, 29, 8, 11)}
  />
);

describe("DatePicker server render", () => {
  it.each(["en-US", "en-GB", "tr-TR", "en-JP", "ar-SA"])(
    "renders no locale-formatted segments on the server for %s",
    (locale) => {
      expect(renderToString(picker(locale))).not.toMatch(SEGMENT);
    }
  );

  it("hydrates without a mismatch and then shows the segments", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(picker("en-US"));
    document.body.appendChild(container);
    const recoverable: unknown[] = [];

    await act(async () => {
      hydrateRoot(container, picker("en-US"), {
        onRecoverableError: (error) => recoverable.push(error),
      });
    });

    expect(recoverable).toEqual([]);
    expect(container.querySelector('[data-type="hour"]')).not.toBeNull();
    expect(container.querySelector('[data-type="dayPeriod"]')).not.toBeNull();
    container.remove();
  });
});
