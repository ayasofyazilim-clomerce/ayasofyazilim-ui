const JSDOMEnvironment = require("jest-environment-jsdom").default;

// Mock canvas before jsdom loads it
const mockCanvas = () => ({});
Object.defineProperty(mockCanvas, "createCanvas", {
  value: () => ({}),
});
Object.defineProperty(mockCanvas, "loadImage", {
  value: () => Promise.resolve({}),
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
