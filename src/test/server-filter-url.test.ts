import {
  applyFilterToParams,
  clearFiltersFromParams,
} from "../custom/master-data-grid/utils/server-filter-url";
import type { ServerFilterConfig } from "../custom/master-data-grid/types";

const str: ServerFilterConfig = {
  type: "string",
  key: "userName",
  label: "User Name",
  placeholder: "p",
};

const multi: ServerFilterConfig = {
  type: "array",
  key: "statuses",
  label: "Status",
  placeholder: "p",
  options: [
    { label: "Paid", value: "Paid" },
    { label: "Sent", value: "Sent" },
  ],
};

const bool: ServerFilterConfig = {
  type: "boolean",
  key: "notActive",
  label: "Active",
  placeholder: "p",
  options: [
    { label: "No", value: true },
    { label: "Yes", value: false },
  ],
};

const range: ServerFilterConfig = {
  type: "date-range",
  key: "creationTime",
  keyFrom: "minCreationTime",
  keyTo: "maxCreationTime",
  label: "Created",
  placeholder: "p",
};

describe("applyFilterToParams", () => {
  it("sets a string value", () => {
    const out = applyFilterToParams(new URLSearchParams(), str, "john");
    expect(out.get("userName")).toBe("john");
  });

  it("does not mutate the params it was given", () => {
    const input = new URLSearchParams("sorting=name%20asc");
    applyFilterToParams(input, str, "john");
    expect(input.has("userName")).toBe(false);
  });

  it("removes the key when the value is undefined", () => {
    const out = applyFilterToParams(
      new URLSearchParams("userName=john"),
      str,
      undefined
    );
    expect(out.has("userName")).toBe(false);
  });

  it("removes the key for an empty string", () => {
    const out = applyFilterToParams(
      new URLSearchParams("userName=john"),
      str,
      ""
    );
    expect(out.has("userName")).toBe(false);
  });

  it("appends one entry per array value", () => {
    const out = applyFilterToParams(new URLSearchParams(), multi, [
      "Paid",
      "Sent",
    ]);
    expect(out.getAll("statuses")).toEqual(["Paid", "Sent"]);
  });

  it("replaces a previous array rather than adding to it", () => {
    const out = applyFilterToParams(
      new URLSearchParams("statuses=Paid&statuses=Sent"),
      multi,
      ["Cancelled"]
    );
    expect(out.getAll("statuses")).toEqual(["Cancelled"]);
  });

  it("removes the key for an empty array", () => {
    const out = applyFilterToParams(
      new URLSearchParams("statuses=Paid"),
      multi,
      []
    );
    expect(out.has("statuses")).toBe(false);
  });

  it("writes false as false rather than dropping it", () => {
    const out = applyFilterToParams(new URLSearchParams(), bool, false);
    expect(out.get("notActive")).toBe("false");
  });

  it("writes both bounds of a range", () => {
    const out = applyFilterToParams(new URLSearchParams(), range, {
      from: "2026-09-01",
      to: "2026-09-08",
    });
    expect(out.get("minCreationTime")).toBe("2026-09-01");
    expect(out.get("maxCreationTime")).toBe("2026-09-08");
  });

  it("writes only the bound that is set and clears the other", () => {
    const out = applyFilterToParams(
      new URLSearchParams("maxCreationTime=2026-09-08"),
      range,
      { from: "2026-09-01" }
    );
    expect(out.get("minCreationTime")).toBe("2026-09-01");
    expect(out.has("maxCreationTime")).toBe(false);
  });

  it("removes both bounds when the range is cleared", () => {
    const out = applyFilterToParams(
      new URLSearchParams(
        "minCreationTime=2026-09-01&maxCreationTime=2026-09-08"
      ),
      range,
      undefined
    );
    expect(out.has("minCreationTime")).toBe(false);
    expect(out.has("maxCreationTime")).toBe(false);
  });

  it("drops skipCount on every mutation, so paging restarts", () => {
    const out = applyFilterToParams(
      new URLSearchParams("skipCount=20&maxResultCount=10"),
      str,
      "john"
    );
    expect(out.has("skipCount")).toBe(false);
    expect(out.get("maxResultCount")).toBe("10");
  });

  it("drops skipCount when a filter is removed too", () => {
    const out = applyFilterToParams(
      new URLSearchParams("skipCount=20&userName=john"),
      str,
      undefined
    );
    expect(out.has("skipCount")).toBe(false);
  });

  it("leaves unrelated query the page owns alone", () => {
    const out = applyFilterToParams(
      new URLSearchParams("sorting=name%20asc&tab=summary"),
      str,
      "john"
    );
    expect(out.get("sorting")).toBe("name asc");
    expect(out.get("tab")).toBe("summary");
  });
});

describe("clearFiltersFromParams", () => {
  it("removes every key the config declares", () => {
    const out = clearFiltersFromParams(
      new URLSearchParams(
        "userName=john&statuses=Paid&minCreationTime=2026-09-01"
      ),
      [str, multi, range]
    );
    expect(out.has("userName")).toBe(false);
    expect(out.has("statuses")).toBe(false);
    expect(out.has("minCreationTime")).toBe(false);
  });

  it("keeps sorting, which today's reset discards", () => {
    const out = clearFiltersFromParams(
      new URLSearchParams("sorting=name%20asc&userName=john"),
      [str]
    );
    expect(out.get("sorting")).toBe("name asc");
  });

  it("keeps a query key no filter declares", () => {
    const out = clearFiltersFromParams(
      new URLSearchParams("tab=summary&userName=john"),
      [str]
    );
    expect(out.get("tab")).toBe("summary");
  });

  it("drops skipCount", () => {
    const out = clearFiltersFromParams(
      new URLSearchParams("skipCount=20&userName=john"),
      [str]
    );
    expect(out.has("skipCount")).toBe(false);
  });
});
