import { render } from "@testing-library/react";

const mockPdfjs = {
  version: "5.4.296",
  GlobalWorkerOptions: { workerSrc: "" },
};

jest.mock("react-pdf", () => ({
  pdfjs: mockPdfjs,
  Document: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="pdf-document">{children}</div>
  ),
  Page: () => null,
  Thumbnail: () => null,
}));

import {
  applyPdfWorkerSrc,
  DEFAULT_PDF_WORKER_SRC,
  PdfWorkerSrcProvider,
} from "../custom/document-viewer/pdf-worker";
import CustomPDFRenderer from "../custom/document-viewer/renderers/pdf";

const DEFAULT_URL =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs";

beforeEach(() => {
  mockPdfjs.GlobalWorkerOptions.workerSrc = "";
});

describe("pdf.js worker source", () => {
  it("importing the renderer does not touch the global", () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- isolateModules needs a synchronous load
      require("../custom/document-viewer/renderers/pdf");
    });
    expect(mockPdfjs.GlobalWorkerOptions.workerSrc).toBe("");
  });

  it("applyPdfWorkerSrc sets and returns the given URL", () => {
    expect(applyPdfWorkerSrc("/pdf.worker.min.mjs")).toBe(
      "/pdf.worker.min.mjs"
    );
    expect(mockPdfjs.GlobalWorkerOptions.workerSrc).toBe("/pdf.worker.min.mjs");
  });

  it("applyPdfWorkerSrc(undefined) falls back to the CDN default", () => {
    expect(DEFAULT_PDF_WORKER_SRC).toBe(DEFAULT_URL);
    expect(applyPdfWorkerSrc(undefined)).toBe(DEFAULT_URL);
    expect(mockPdfjs.GlobalWorkerOptions.workerSrc).toBe(DEFAULT_URL);
  });

  it("the renderer applies the provider's value before rendering Document", () => {
    const mainState = {
      currentDocument: { uri: "/a.pdf", fileType: "pdf" },
    } as never;
    const { getByTestId } = render(
      <PdfWorkerSrcProvider value="/w.mjs">
        <CustomPDFRenderer mainState={mainState} />
      </PdfWorkerSrcProvider>
    );
    expect(getByTestId("pdf-document")).toBeTruthy();
    expect(mockPdfjs.GlobalWorkerOptions.workerSrc).toBe("/w.mjs");
  });

  it("the renderer falls back to the default without a provider", () => {
    const mainState = {
      currentDocument: { uri: "/a.pdf", fileType: "pdf" },
    } as never;
    render(<CustomPDFRenderer mainState={mainState} />);
    expect(mockPdfjs.GlobalWorkerOptions.workerSrc).toBe(DEFAULT_URL);
  });
});
