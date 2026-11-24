/* eslint-disable */
const JSDOMEnvironment = require("jest-environment-jsdom").default;

// Mock canvas before jsdom loads it
const mockCanvas = () => ({});
Object.defineProperty(mockCanvas, "createCanvas", {
  value: () => ({}),
});
Object.defineProperty(mockCanvas, "loadImage", {
  value: () => Promise.resolve({}),
});
// jsdom treats canvas as installed once `require("canvas")` returns anything, and then builds a
// `new Canvas.Image()` for every `<img src>`. Without this stub, rendering any image throws
// "Canvas.Image is not a constructor". It never decodes: natural size stays 0×0, as in jsdom
// without canvas.
Object.defineProperty(mockCanvas, "Image", {
  value: class Image {
    constructor() {
      this.naturalWidth = 0;
      this.naturalHeight = 0;
      this.onerror = null;
      this.src = "";
    }
  },
});

module.exports = class CustomJSDOMEnvironment extends JSDOMEnvironment {
  constructor(config, context) {
    // Mock canvas module globally before parent constructor
    if (typeof global !== "undefined") {
      const Module = require("module");
      const originalRequire = Module.prototype.require;

      Module.prototype.require = function (id) {
        if (id === "canvas") {
          return mockCanvas;
        }
        return originalRequire.apply(this, arguments);
      };
    }

    super(config, context);
  }

  async setup() {
    await super.setup();
  }

  async teardown() {
    await super.teardown();
  }
};
