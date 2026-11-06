import type { ServerFilterConfig } from "../custom/master-data-grid/types";
import { getGridUrlParams } from "../custom/master-data-grid/utils/grid-url-params";

const userName: ServerFilterConfig = {
  type: "string",
  key: "userName",
  label: "User name",
  placeholder: "p",
};

const statuses: ServerFilterConfig = {
  type: "array",
  key: "statuses",
  label: "Status",
  placeholder: "p",
  options: [
    { label: "Paid", value: "Paid" },
    { label: "Sent", value: "Sent" },
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

const filters = [userName, statuses, range];

describe("getGridUrlParams query", () => {
  it("holds a prefixed grid's filters under the un-prefixed keys an ABP list call takes", () => {
    const { query, filters: values } = getGridUrlParams(
      {
        "a.userName": "john",
        "a.statuses": ["Paid", "Sent"],
        "a.minCreationTime": "2026-01-01",
        "a.maxCreationTime": "2026-02-01",
        "a.skipCount": "20",
        "a.maxResultCount": "20",
        // Another grid's keys, a default grid's keys and an unrelated key.
        "b.userName": "jane",
        "b.statuses": "Sent",
        "b.minCreationTime": "2025-01-01",
        userName: "plain",
        maxCreationTime: "1999-01-01",
        skipCount: "40",
        tab: "orders",
      },
      { prefix: "a", filters, pageSize: 10 }
    );

    expect(query).toEqual({
      userName: "john",
      statuses: ["Paid", "Sent"],
      minCreationTime: "2026-01-01",
      maxCreationTime: "2026-02-01",
    });
    // `filters` keeps its parsed shapes: the range under its own key.
    expect(values).toEqual({
      userName: "john",
      statuses: ["Paid", "Sent"],
      creationTime: { from: "2026-01-01", to: "2026-02-01" },
    });
  });

  it("gives a single array value as string[] and only the half of a range that is set", () => {
    const params = new URLSearchParams(
      "b.statuses=Paid&b.maxCreationTime=2026-03-01&a.statuses=Sent&a.minCreationTime=2020-01-01"
    );
    expect(getGridUrlParams(params, { prefix: "b", filters }).query).toEqual({
      statuses: ["Paid"],
      maxCreationTime: "2026-03-01",
    });
  });

  it("reads a default grid's un-prefixed keys and ignores every prefixed one", () => {
    const params = new URLSearchParams(
      "userName=x&statuses=Paid&statuses=Sent&minCreationTime=2026-01-01&a.userName=y&a.maxCreationTime=2026-09-09"
    );
    expect(getGridUrlParams(params, { filters }).query).toEqual({
      userName: "x",
      statuses: ["Paid", "Sent"],
      minCreationTime: "2026-01-01",
    });
  });

  it("drops empty values and holds nothing without filters", () => {
    expect(
      getGridUrlParams(
        { "a.userName": "", "a.statuses": ["", ""], "a.minCreationTime": "" },
        { prefix: "a", filters }
      ).query
    ).toEqual({});
    expect(getGridUrlParams({ userName: "x" }).query).toEqual({});
  });

  it("spreads into a list call with no date-range object in it", () => {
    const { query, skipCount, maxResultCount } = getGridUrlParams(
      { "a.minCreationTime": "2026-01-01", "a.skipCount": "10" },
      { prefix: "a", filters }
    );
    expect({ ...query, skipCount, maxResultCount }).toEqual({
      minCreationTime: "2026-01-01",
      skipCount: 10,
      maxResultCount: 10,
    });
  });
});
