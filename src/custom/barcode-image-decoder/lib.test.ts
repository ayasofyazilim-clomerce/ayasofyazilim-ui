import { buildDecodeScales } from "./lib";

describe("buildDecodeScales", () => {
  it("tries the capped natural size first, then smaller", () => {
    expect(buildDecodeScales(4000, 3000)).toEqual([1600, 1024, 640]);
  });

  it("never upscales an image smaller than the first cap", () => {
    expect(buildDecodeScales(800, 600)).toEqual([800, 640]);
  });

  it("collapses to a single pass for an image below every cap", () => {
    expect(buildDecodeScales(320, 240)).toEqual([320]);
  });

  it("measures the longest edge, not the width", () => {
    expect(buildDecodeScales(600, 2400)).toEqual([1600, 1024, 640]);
  });
});
