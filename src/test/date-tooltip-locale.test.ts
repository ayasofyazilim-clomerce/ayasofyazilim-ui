import { formatToLocalizedDate } from "../custom/date-tooltip";

const date = "2026-09-29T08:11:00Z";

describe("formatToLocalizedDate locale", () => {
  it("formats with the date locale when one is given", () => {
    const formatted = formatToLocalizedDate({
      date,
      timeZone: "UTC",
      localization: {
        lang: "en",
        locale: "tr-TR",
        timeZone: "UTC",
        dateLocale: "en-GB",
      },
    });
    expect(formatted.startsWith("29 September 2026")).toBe(true);
  });

  it("keeps the UI language when no date locale is given", () => {
    const formatted = formatToLocalizedDate({
      date,
      timeZone: "UTC",
      localization: { lang: "en", locale: "tr-TR", timeZone: "UTC" },
    });
    expect(formatted.startsWith("September 29, 2026")).toBe(true);
  });
});
