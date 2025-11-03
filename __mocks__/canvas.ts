// Mock canvas module to avoid native dependencies in tests
const mockCanvas = {
  createCanvas: () => ({}),
  createImageData: () => ({}),
  loadImage: () => Promise.resolve({}),
};

export default mockCanvas;
