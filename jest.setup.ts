import "@testing-library/jest-dom";
import React from "react";

// Mock canvas to avoid native dependency issues
jest.mock("canvas", () => ({}), { virtual: true });

// Minimal lucide-react mock - returns actual SVG elements
jest.mock("lucide-react", () => {
  return new Proxy(
    {},
    {
      get: (target, prop) => {
        // Return a component that renders an SVG
        return React.forwardRef((props: any, ref: any) =>
          React.createElement(
            "svg",
            {
              ref,
              ...props,
              "data-lucide": prop,
              "data-testid": `lucide-${String(prop)
                .replace(/([A-Z])/g, "-$1")
                .toLowerCase()
                .slice(1)}`,
            },
            React.createElement("path", { d: "M0 0" })
          )
        );
      },
    }
  );
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as any;

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockReturnValue("TR");
});
