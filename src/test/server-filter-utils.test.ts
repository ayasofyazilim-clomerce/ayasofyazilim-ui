import {
  formatFilterValue,
  readFilterValue,
  urlKeysOf,
  visibleFilters,
} from "../custom/master-data-grid/utils/server-filter-utils";
import type { ServerFilterConfig } from "../custom/master-data-grid/types";

const localization = { locale: "en-GB", timeZone: "UTC", lang: "en" };

const str: ServerFilterConfig = {
  type: "string",
  key: "userName",
  label: "User Name",
  placeholder: "Filter with User Name",
};

const range: ServerFilterConfig = {
  type: "date-range",
  key: "creationTime",
  keyFrom: "minCreationTime",
  keyTo: "maxCreationTime",
  label: "Created",
  placeholder: "Filter with Created",
};

const select: ServerFilterConfig = {
  type: "select",
  key: "merchantId",
  label: "Merchant",
  placeholder: "Filter with Merchant",
  options: [
    { label: "Karaca Home", value: "8f1b-0001" },
    { label: "Vakko", value: "8f1b-0002" },
  ],
};

const multi: ServerFilterConfig = {
  type: "array",
  key: "statuses",
  label: "Status",
  placeholder: "Filter with Status",
  options: [
    { label: "Paid", value: "Paid" },
    { label: "Sent", value: "Sent" },
    { label: "Cancelled", value: "Cancelled" },
    { label: "Error", value: "Error" },
  ],
};

const bool: ServerFilterConfig = {
  type: "boolean",
  key: "notActive",
  label: "Active",
  placeholder: "Filter with Active",
  options: [
    { label: "No", value: true },
    { label: "Yes", value: false },
  ],
};

describe("urlKeysOf", () => {
  it("returns the single key for a plain filter", () => {
    expect(urlKeysOf(str)).toEqual(["userName"]);
  });

  it("returns both endpoint keys for a range, not the control key", () => {
    expect(urlKeysOf(range)).toEqual(["minCreationTime", "maxCreationTime"]);
  });
});

describe("visibleFilters", () => {
  it("drops a filter whose when is false", () => {
    const hidden: ServerFilterConfig = { ...str, key: "hidden", when: false };
    expect(visibleFilters([str, hidden]).map((f) => f.key)).toEqual([
      "userName",
    ]);
  });

  it("keeps a filter with when undefined or true", () => {
    const shown: ServerFilterConfig = { ...str, key: "shown", when: true };
    expect(visibleFilters([str, shown])).toHaveLength(2);
  });

  it("returns an empty array for undefined", () => {
    expect(visibleFilters(undefined)).toEqual([]);
  });
});

describe("readFilterValue", () => {
  it("reads a string", () => {
    const params = new URLSearchParams("userName=john");
    expect(readFilterValue(str, params)).toBe("john");
  });

  it("returns undefined when the key is absent", () => {
    expect(readFilterValue(str, new URLSearchParams())).toBeUndefined();
  });

  it("reads a repeated parameter as an array", () => {
    const params = new URLSearchParams("statuses=Paid&statuses=Sent");
    expect(readFilterValue(multi, params)).toEqual(["Paid", "Sent"]);
  });

  it("reads a single repeated parameter as a one-item array", () => {
    expect(readFilterValue(multi, new URLSearchParams("statuses=Paid"))).toEqual(
      ["Paid"]
    );
  });

  it("reads false as false, not as absent", () => {
    expect(readFilterValue(bool, new URLSearchParams("notActive=false"))).toBe(
      false
    );
  });

  it("reads a number", () => {
    const num: ServerFilterConfig = {
      type: "number",
      key: "minTotalAmount",
      label: "Min",
      placeholder: "Min",
    };
    expect(readFilterValue(num, new URLSearchParams("minTotalAmount=25"))).toBe(
      25
    );
  });

  it("reads a range from both endpoint keys", () => {
    const params = new URLSearchParams(
      "minCreationTime=2026-09-01&maxCreationTime=2026-09-08"
    );
    expect(readFilterValue(range, params)).toEqual({
      from: "2026-09-01",
      to: "2026-09-08",
    });
  });

  it("reads a half-open range", () => {
    const params = new URLSearchParams("minCreationTime=2026-09-01");
    expect(readFilterValue(range, params)).toEqual({
      from: "2026-09-01",
      to: undefined,
    });
  });

  it("returns undefined for a range with neither bound", () => {
    expect(readFilterValue(range, new URLSearchParams())).toBeUndefined();
  });
});

describe("formatFilterValue", () => {
  it("shows a string as itself", () => {
    expect(formatFilterValue(str, "john", localization)).toBe("john");
  });

  it("shows the option label, not the raw value", () => {
    expect(formatFilterValue(select, "8f1b-0001", localization)).toBe(
      "Karaca Home"
    );
  });

  it("falls back to the raw value when no option matches", () => {
    expect(formatFilterValue(select, "8f1b-9999", localization)).toBe(
      "8f1b-9999"
    );
  });

  it("shows up to two array labels then a remainder", () => {
    expect(
      formatFilterValue(multi, ["Paid", "Sent", "Cancelled", "Error"], localization)
    ).toBe("Paid, Sent +2");
  });

  it("shows two array labels with no remainder", () => {
    expect(formatFilterValue(multi, ["Paid", "Sent"], localization)).toBe(
      "Paid, Sent"
    );
  });

  it("uses the config's own boolean labels, so an inverted pair still reads right", () => {
    expect(formatFilterValue(bool, true, localization)).toBe("No");
    expect(formatFilterValue(bool, false, localization)).toBe("Yes");
  });

  it("formats a range in the localization's locale and zone", () => {
    expect(
      formatFilterValue(
        range,
        { from: "2026-09-01T00:00:00Z", to: "2026-09-08T00:00:00Z" },
        localization
      )
    ).toBe("01/09/2026 – 08/09/2026");
  });

  it("formats a half-open range with only the bound that is set", () => {
    expect(
      formatFilterValue(range, { from: "2026-09-01T00:00:00Z" }, localization)
    ).toBe("01/09/2026 – ");
  });

  it("formats a single date", () => {
    const date: ServerFilterConfig = {
      type: "date",
      key: "validOn",
      label: "Valid on",
      placeholder: "Valid on",
    };
    expect(formatFilterValue(date, "2026-09-08T00:00:00Z", localization)).toBe(
      "08/09/2026"
    );
  });

  it("joins string-array entries", () => {
    const tags: ServerFilterConfig = {
      type: "string-array",
      key: "tagNumbers",
      label: "Tag numbers",
      placeholder: "Tag numbers",
    };
    expect(formatFilterValue(tags, ["TR1", "TR2"], localization)).toBe(
      "TR1, TR2"
    );
  });
});
