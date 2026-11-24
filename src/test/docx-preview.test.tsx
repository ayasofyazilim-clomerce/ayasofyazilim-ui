import { act, render, screen, waitFor } from "@testing-library/react";

const mockRenderAsync = jest.fn();
jest.mock("docx-preview", () => ({
  renderAsync: (...args: unknown[]) => mockRenderAsync(...args),
}));

// react-doc-viewer ships ESM only; the viewer shell is mocked and records the renderer list it receives.
const mockPluginRenderers: unknown[][] = [];
jest.mock("react-doc-viewer", () => ({
  __esModule: true,
  default: ({ pluginRenderers }: { pluginRenderers: unknown[] }) => {
    mockPluginRenderers.push(pluginRenderers);
    return <div data-testid="doc-viewer" />;
  },
  DocViewerRenderers: [],
  arrayBufferFileLoader: jest.fn(),
}));
jest.mock("react-pdf", () => ({
  pdfjs: { version: "5.4.296", GlobalWorkerOptions: { workerSrc: "" } },
  Document: () => null,
  Page: () => null,
  Thumbnail: () => null,
}));

import { DocxPreview } from "../custom/docx-preview";
import DocumentViewer, { DocxRenderer } from "../custom/document-viewer";

const OPTIONS = {
  className: "docx",
  inWrapper: true,
  useBase64URL: true,
  ignoreLastRenderedPageBreak: true,
};

function bytes(...values: number[]) {
  return new Uint8Array(values).buffer;
}

function deferred() {
  let resolve!: () => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  mockRenderAsync.mockReset();
});

describe("DocxPreview", () => {
  it("passes the ArrayBuffer and the studio's options to renderAsync", async () => {
    mockRenderAsync.mockImplementation(async (_b, container: HTMLElement) => {
      container.textContent = "rendered";
    });
    const buffer = bytes(1, 2, 3);
    render(<DocxPreview file={buffer} />);
    await screen.findByText("rendered");
    expect(mockRenderAsync).toHaveBeenCalledTimes(1);
    const [data, container, styles, options] = mockRenderAsync.mock.calls[0];
    expect(data).toBe(buffer);
    expect(container).toBeInstanceOf(HTMLElement);
    expect(styles).toBeUndefined();
    expect(options).toEqual(OPTIONS);
  });

  it("reads a Blob into an ArrayBuffer", async () => {
    mockRenderAsync.mockImplementation(async (_b, container: HTMLElement) => {
      container.textContent = "from blob";
    });
    render(<DocxPreview file={new Blob([new Uint8Array([9, 8, 7])])} />);
    await screen.findByText("from blob");
    const data = mockRenderAsync.mock.calls[0][0] as ArrayBuffer;
    expect(Array.from(new Uint8Array(data))).toEqual([9, 8, 7]);
  });

  it("shows the loading label, then the rendered content", async () => {
    const d = deferred();
    mockRenderAsync.mockImplementation(async (_b, container: HTMLElement) => {
      await d.promise;
      container.textContent = "page one";
    });
    render(<DocxPreview file={bytes(1)} />);
    expect(await screen.findByText("Rendering preview…")).toBeTruthy();
    await act(async () => {
      d.resolve();
    });
    await screen.findByText("page one");
    expect(screen.queryByText("Rendering preview…")).toBeNull();
  });

  it("uses custom labels", async () => {
    mockRenderAsync.mockReturnValue(new Promise(() => {}));
    render(<DocxPreview file={bytes(1)} labels={{ loading: "Yükleniyor" }} />);
    expect(await screen.findByText("Yükleniyor")).toBeTruthy();
  });

  it("shows the error label and calls onError on a rejection", async () => {
    const boom = new Error("corrupt");
    mockRenderAsync.mockRejectedValue(boom);
    const onError = jest.fn();
    render(<DocxPreview file={bytes(1)} onError={onError} />);
    expect(
      await screen.findByText("This document could not be previewed."),
    ).toBeTruthy();
    expect(onError).toHaveBeenCalledWith(boom);
  });

  it("keeps only the newest render when file changes mid-render", async () => {
    const first = deferred();
    const second = deferred();
    mockRenderAsync
      .mockImplementationOnce(async (_b, container: HTMLElement) => {
        await first.promise;
        container.textContent = "first output";
      })
      .mockImplementationOnce(async (_b, container: HTMLElement) => {
        await second.promise;
        container.textContent = "second output";
      });
    const { rerender } = render(<DocxPreview file={bytes(1)} />);
    await waitFor(() => expect(mockRenderAsync).toHaveBeenCalledTimes(1));
    rerender(<DocxPreview file={bytes(2)} />);
    await waitFor(() => expect(mockRenderAsync).toHaveBeenCalledTimes(2));
    await act(async () => {
      second.resolve();
    });
    await screen.findByText("second output");
    await act(async () => {
      first.resolve();
    });
    expect(screen.queryByText("first output")).toBeNull();
    expect(screen.getByText("second output")).toBeTruthy();
  });
});

describe("DocxPreview fit", () => {
  const restore: Array<() => void> = [];
  function stub(
    prop: "offsetWidth" | "offsetHeight" | "clientWidth",
    fn: (el: HTMLElement) => number,
  ) {
    const orig =
      Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop) ??
      Object.getOwnPropertyDescriptor(Element.prototype, prop);
    Object.defineProperty(HTMLElement.prototype, prop, {
      configurable: true,
      get(this: HTMLElement) {
        return fn(this);
      },
    });
    restore.push(() => {
      if (orig) Object.defineProperty(HTMLElement.prototype, prop, orig);
      else
        delete (HTMLElement.prototype as unknown as Record<string, unknown>)[
          prop
        ];
    });
  }
  afterEach(() => restore.splice(0).forEach((r) => r()));

  it("scales the page-width wrapper to the container and renders in an attached node", async () => {
    let attachedDuringRender = false;
    mockRenderAsync.mockImplementation(async (_b, container: HTMLElement) => {
      attachedDuringRender = container.isConnected;
      const wrap = document.createElement("div");
      wrap.className = "docx-wrapper";
      container.appendChild(wrap);
    });
    stub("offsetWidth", (el) =>
      el.classList.contains("docx-wrapper") ? 1000 : 0,
    );
    stub("offsetHeight", (el) =>
      el.classList.contains("docx-wrapper") ? 1400 : 0,
    );
    stub("clientWidth", () => 524);
    const { container } = render(<DocxPreview file={bytes(1)} />);
    await waitFor(() =>
      expect(container.querySelector("[data-status=ready]")).not.toBeNull(),
    );
    expect(attachedDuringRender).toBe(true);
    const wrap = container.querySelector<HTMLElement>(".docx-wrapper")!;
    expect(wrap.style.transform).toBe("scale(0.5)");
    expect(wrap.style.width).toBe("max-content");
    expect(wrap.parentElement?.style.width).toBe("500px");
    expect(wrap.parentElement?.style.height).toBe("700px");
  });

  it("does not scale with fit=none", async () => {
    mockRenderAsync.mockImplementation(async (_b, c: HTMLElement) => {
      const wrap = document.createElement("div");
      wrap.className = "docx-wrapper";
      c.appendChild(wrap);
    });
    stub("offsetWidth", () => 1000);
    stub("clientWidth", () => 524);
    const { container } = render(<DocxPreview file={bytes(1)} fit="none" />);
    await waitFor(() =>
      expect(container.querySelector("[data-status=ready]")).not.toBeNull(),
    );
    expect(
      container.querySelector<HTMLElement>(".docx-wrapper")!.style.transform,
    ).toBe("none");
  });
});

describe("DocxRenderer", () => {
  it("is weight 1 for docx files", () => {
    expect(DocxRenderer.weight).toBe(1);
    expect(DocxRenderer.fileTypes).toEqual([
      "docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]);
  });

  it("is not part of the default DocumentViewer renderers", () => {
    render(<DocumentViewer document={{ uri: "x.docx", fileType: "docx" }} />);
    expect(mockPluginRenderers).toHaveLength(1);
    expect(mockPluginRenderers[0]).not.toContain(DocxRenderer);
    render(
      <DocumentViewer
        document={{ uri: "x.docx", fileType: "docx" }}
        renderers={[DocxRenderer]}
      />,
    );
    expect(mockPluginRenderers[1]).toContain(DocxRenderer);
  });
});
