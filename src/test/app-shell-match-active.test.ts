import { matchActiveHref } from "../custom/app-shell/match-active-href";

describe("matchActiveHref", () => {
  const nav = ["/playground", "/traces"];

  it("matches an exact path", () => {
    expect(matchActiveHref(nav, "/playground")).toBe("/playground");
  });

  it("matches a nested path to its parent", () => {
    expect(matchActiveHref(nav, "/playground/x")).toBe("/playground");
  });

  it("never matches a sibling that only shares a prefix", () => {
    expect(matchActiveHref(nav, "/playground-x")).toBeNull();
  });

  it("matches the root only on the root", () => {
    expect(matchActiveHref(["/"], "/")).toBe("/");
    expect(matchActiveHref(["/", "/traces"], "/traces")).toBe("/traces");
    expect(matchActiveHref(["/"], "/settings")).toBeNull();
  });

  it("picks the longest matching prefix", () => {
    expect(
      matchActiveHref(["/docs", "/docs/api", "/docs/api-x"], "/docs/api/v2")
    ).toBe("/docs/api");
  });

  it("ignores the query string and the hash", () => {
    expect(matchActiveHref(["/projects"], "/projects?edit=1")).toBe(
      "/projects"
    );
    expect(matchActiveHref(["/networks"], "/networks#add")).toBe("/networks");
  });

  it("returns the href as given when it carries a query or hash", () => {
    expect(matchActiveHref(["/networks#add"], "/networks")).toBe(
      "/networks#add"
    );
  });

  it("ignores trailing slashes", () => {
    expect(matchActiveHref(["/traces/"], "/traces")).toBe("/traces/");
    expect(matchActiveHref(["/traces"], "/traces/")).toBe("/traces");
  });

  it("returns null for an empty list", () => {
    expect(matchActiveHref([], "/playground")).toBeNull();
  });
});
