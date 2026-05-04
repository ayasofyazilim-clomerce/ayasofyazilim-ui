import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";

// --- Mock react-signature-pad-wrapper ---
// Captures stroke handlers so tests can simulate drawing without a real canvas.

let _beginStrokeHandler: (() => void) | undefined;
let _endStrokeHandler: (() => void) | undefined;

const fakePad = {
  clear: jest.fn(),
  isEmpty: jest.fn(() => true),
  toDataURL: jest.fn(() => "data:image/png;base64,MOCK"),
  toSVG: jest.fn(() => "<svg></svg>"),
  fromDataURL: jest.fn(),
  toData: jest.fn(() => []),
  fromData: jest.fn(),
  handleResize: jest.fn(),
  instance: {
    addEventListener: jest.fn((event: string, handler: () => void) => {
      if (event === "beginStroke") _beginStrokeHandler = handler;
      if (event === "endStroke") _endStrokeHandler = handler;
    }),
    removeEventListener: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
  canvas: {
    current: Object.assign(document.createElement("canvas"), {
      toDataURL: jest.fn(() => "data:image/png;base64,MOCK"),
      width: 400,
      height: 200,
    }),
  },
};

jest.mock("react-signature-pad-wrapper", () => {
  const ReactMock = require("react");
  const MockSignaturePad = ReactMock.forwardRef((_props: any, ref: any) => {
    ReactMock.useImperativeHandle(ref, () => fakePad, []);
    return ReactMock.createElement("canvas", {
      "data-testid": "signature-pad-canvas",
    });
  });
  return { __esModule: true, default: MockSignaturePad };
});

// --- Mock document.fullscreenElement and requestFullscreen ---
Object.defineProperty(document, "fullscreenElement", {
  writable: true,
  value: null,
});

// --- Import component after mocks ---
import {
  DEFAULT_DRAW_PAD_TRANSLATIONS,
  DrawPad,
  type DrawPadHandle,
  type DrawPadTranslations,
} from "../custom/draw-pad";

// Helper: simulate a begin stroke (marks canvas as having content)
function simulateBeginStroke() {
  act(() => _beginStrokeHandler?.());
}

// Helper: simulate an end stroke
function simulateEndStroke() {
  act(() => _endStrokeHandler?.());
}

// ─────────────────────────────────────────────────────────────────────────────
describe("DrawPad", () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  describe("rendering", () => {
    it("renders the canvas container", () => {
      render(<DrawPad />);
      expect(screen.getByTestId("draw-pad")).toBeInTheDocument();
      expect(screen.getByTestId("signature-pad-canvas")).toBeInTheDocument();
    });

    it("shows no buttons by default", () => {
      render(<DrawPad />);
      expect(screen.queryByTestId("draw-pad-clear")).not.toBeInTheDocument();
      expect(screen.queryByTestId("draw-pad-download")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("draw-pad-fullscreen")
      ).not.toBeInTheDocument();
    });

    it("shows clear button when showClear is true", () => {
      render(<DrawPad showClear />);
      expect(screen.getByTestId("draw-pad-clear")).toBeInTheDocument();
    });

    it("shows download button when showDownload is true", () => {
      render(<DrawPad showDownload />);
      expect(screen.getByTestId("draw-pad-download")).toBeInTheDocument();
    });

    it("shows fullscreen button when showFullscreen is true", () => {
      render(<DrawPad showFullscreen />);
      expect(screen.getByTestId("draw-pad-fullscreen")).toBeInTheDocument();
    });

    it("applies className to the container", () => {
      render(<DrawPad className="my-custom-class" />);
      expect(screen.getByTestId("draw-pad")).toHaveClass("my-custom-class");
    });
  });

  // ── Button states ───────────────────────────────────────────────────────────

  describe("button states", () => {
    it("clear button is disabled when canvas is empty", () => {
      render(<DrawPad showClear />);
      expect(screen.getByTestId("draw-pad-clear")).toBeDisabled();
    });

    it("download button is disabled when canvas is empty", () => {
      render(<DrawPad showDownload />);
      expect(screen.getByTestId("draw-pad-download")).toBeDisabled();
    });

    it("clear button becomes enabled after a stroke", () => {
      render(<DrawPad showClear />);
      expect(screen.getByTestId("draw-pad-clear")).toBeDisabled();
      simulateBeginStroke();
      expect(screen.getByTestId("draw-pad-clear")).not.toBeDisabled();
    });

    it("download button becomes enabled after a stroke", () => {
      render(<DrawPad showDownload />);
      simulateBeginStroke();
      expect(screen.getByTestId("draw-pad-download")).not.toBeDisabled();
    });

    it("clear button is disabled when disabled prop is true (even with content)", () => {
      render(<DrawPad showClear disabled />);
      simulateBeginStroke();
      expect(screen.getByTestId("draw-pad-clear")).toBeDisabled();
    });

    it("download button is disabled when disabled prop is true (even with content)", () => {
      render(<DrawPad showDownload disabled />);
      simulateBeginStroke();
      expect(screen.getByTestId("draw-pad-download")).toBeDisabled();
    });
  });

  // ── Disabled appearance ─────────────────────────────────────────────────────

  describe("disabled state", () => {
    it("applies opacity and pointer-events classes when disabled", () => {
      render(<DrawPad disabled />);
      const container = screen.getByTestId("draw-pad");
      expect(container).toHaveClass("pointer-events-none");
      expect(container).toHaveClass("opacity-60");
    });

    it("does not apply disabled classes when enabled", () => {
      render(<DrawPad />);
      const container = screen.getByTestId("draw-pad");
      expect(container).not.toHaveClass("pointer-events-none");
      expect(container).not.toHaveClass("opacity-60");
    });
  });

  // ── Clear behaviour ─────────────────────────────────────────────────────────

  describe("clear behaviour", () => {
    it("calls onClear and fakePad.clear when clear button clicked (no confirm)", async () => {
      const onClear = jest.fn();
      const user = userEvent.setup();
      render(<DrawPad showClear onClear={onClear} />);
      simulateBeginStroke();
      await user.click(screen.getByTestId("draw-pad-clear"));
      expect(fakePad.clear).toHaveBeenCalledTimes(1);
      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it("disables clear button again after clearing", async () => {
      const user = userEvent.setup();
      render(<DrawPad showClear />);
      simulateBeginStroke();
      await user.click(screen.getByTestId("draw-pad-clear"));
      expect(screen.getByTestId("draw-pad-clear")).toBeDisabled();
    });

    it("opens confirmation dialog when clearConfirm is true", async () => {
      const user = userEvent.setup();
      render(<DrawPad showClear clearConfirm />);
      simulateBeginStroke();
      await user.click(screen.getByTestId("draw-pad-clear"));
      await waitFor(() => {
        expect(
          screen.getByTestId("draw-pad-confirm-dialog")
        ).toBeInTheDocument();
      });
      expect(fakePad.clear).not.toHaveBeenCalled();
    });

    it("clears and closes dialog when confirm button clicked", async () => {
      const onClear = jest.fn();
      const user = userEvent.setup();
      render(<DrawPad showClear clearConfirm onClear={onClear} />);
      simulateBeginStroke();
      await user.click(screen.getByTestId("draw-pad-clear"));
      await waitFor(() =>
        expect(
          screen.getByTestId("draw-pad-confirm-confirm")
        ).toBeInTheDocument()
      );
      await user.click(screen.getByTestId("draw-pad-confirm-confirm"));
      expect(fakePad.clear).toHaveBeenCalledTimes(1);
      expect(onClear).toHaveBeenCalledTimes(1);
      await waitFor(() =>
        expect(
          screen.queryByTestId("draw-pad-confirm-dialog")
        ).not.toBeInTheDocument()
      );
    });

    it("does not clear when cancel button clicked", async () => {
      const user = userEvent.setup();
      render(<DrawPad showClear clearConfirm />);
      simulateBeginStroke();
      await user.click(screen.getByTestId("draw-pad-clear"));
      await waitFor(() =>
        expect(
          screen.getByTestId("draw-pad-confirm-cancel")
        ).toBeInTheDocument()
      );
      await user.click(screen.getByTestId("draw-pad-confirm-cancel"));
      expect(fakePad.clear).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(
          screen.queryByTestId("draw-pad-confirm-dialog")
        ).not.toBeInTheDocument()
      );
    });
  });

  // ── Download behaviour ──────────────────────────────────────────────────────

  describe("download behaviour", () => {
    // Prevent real anchor navigation; we only care about the onDownload callback.
    let clickSpy: jest.SpyInstance;
    beforeEach(() => {
      clickSpy = jest
        .spyOn(HTMLAnchorElement.prototype, "click")
        .mockImplementation(() => {});
      global.URL.createObjectURL = jest.fn(() => "blob:mock");
      global.URL.revokeObjectURL = jest.fn();
    });
    afterEach(() => clickSpy.mockRestore());

    it("opens format dropdown when download button clicked", async () => {
      const user = userEvent.setup();
      render(<DrawPad showDownload />);
      simulateBeginStroke();
      await user.click(screen.getByTestId("draw-pad-download"));
      await waitFor(() =>
        expect(
          screen.getByTestId("draw-pad-download-png-transparent")
        ).toBeInTheDocument()
      );
    });

    it("calls onDownload with correct format when PNG (Transparent) selected", async () => {
      const onDownload = jest.fn();
      const user = userEvent.setup();
      render(<DrawPad showDownload onDownload={onDownload} />);
      simulateBeginStroke();
      await user.click(screen.getByTestId("draw-pad-download"));
      await waitFor(() =>
        expect(
          screen.getByTestId("draw-pad-download-png-transparent")
        ).toBeInTheDocument()
      );
      await user.click(screen.getByTestId("draw-pad-download-png-transparent"));
      expect(onDownload).toHaveBeenCalledWith(
        "png-transparent",
        expect.any(String)
      );
    });

    it("calls onDownload with correct format when SVG selected", async () => {
      const onDownload = jest.fn();
      const user = userEvent.setup();
      render(<DrawPad showDownload onDownload={onDownload} />);
      simulateBeginStroke();
      await user.click(screen.getByTestId("draw-pad-download"));
      await waitFor(() =>
        expect(screen.getByTestId("draw-pad-download-svg")).toBeInTheDocument()
      );
      await user.click(screen.getByTestId("draw-pad-download-svg"));
      expect(onDownload).toHaveBeenCalledWith("svg", "<svg></svg>");
    });
  });

  // ── Translations ────────────────────────────────────────────────────────────

  describe("translations", () => {
    const customTranslations: DrawPadTranslations = {
      ...DEFAULT_DRAW_PAD_TRANSLATIONS,
      "DrawPad.clear": "Temizle",
      "DrawPad.download": "İndir",
      "DrawPad.fullscreen": "Tam Ekran",
      "DrawPad.exitFullscreen": "Kapat",
      "DrawPad.clearConfirm.title": "Silmek istiyor musunuz?",
      "DrawPad.clearConfirm.confirmLabel": "Evet",
      "DrawPad.clearConfirm.cancelLabel": "Hayır",
      "DrawPad.clearConfirm.description": "Geri alınamaz.",
      "DrawPad.download.pngTransparent": "PNG Şeffaf",
      "DrawPad.download.pngWhite": "PNG Beyaz",
      "DrawPad.download.jpeg": "JPEG",
      "DrawPad.download.svg": "SVG",
      "DrawPad.penColor": "Kalem rengi",
      "DrawPad.penThickness": "Kalem kalınlığı",
    };

    it("uses custom aria-label for clear button", () => {
      render(<DrawPad showClear translations={customTranslations} />);
      expect(screen.getByTestId("draw-pad-clear")).toHaveAttribute(
        "aria-label",
        "Temizle"
      );
    });

    it("uses custom aria-label for download button", () => {
      render(<DrawPad showDownload translations={customTranslations} />);
      expect(screen.getByTestId("draw-pad-download")).toHaveAttribute(
        "aria-label",
        "İndir"
      );
    });

    it("uses custom aria-label for fullscreen button", () => {
      render(<DrawPad showFullscreen translations={customTranslations} />);
      expect(screen.getByTestId("draw-pad-fullscreen")).toHaveAttribute(
        "aria-label",
        "Tam Ekran"
      );
    });

    it("uses custom aria-label for pen color button", () => {
      render(<DrawPad showPenColor translations={customTranslations} />);
      expect(screen.getByTestId("draw-pad-pen-color")).toHaveAttribute(
        "aria-label",
        "Kalem rengi"
      );
    });

    it("uses custom aria-label for pen thickness button", () => {
      render(<DrawPad showPenThickness translations={customTranslations} />);
      expect(screen.getByTestId("draw-pad-pen-thickness")).toHaveAttribute(
        "aria-label",
        "Kalem kalınlığı"
      );
    });

    it("shows custom dialog title in clear confirmation", async () => {
      const user = userEvent.setup();
      render(
        <DrawPad showClear clearConfirm translations={customTranslations} />
      );
      simulateBeginStroke();
      await user.click(screen.getByTestId("draw-pad-clear"));
      await waitFor(() =>
        expect(screen.getByTestId("draw-pad-confirm-title")).toHaveTextContent(
          "Silmek istiyor musunuz?"
        )
      );
    });

    it("shows custom confirm/cancel labels in dialog", async () => {
      const user = userEvent.setup();
      render(
        <DrawPad showClear clearConfirm translations={customTranslations} />
      );
      simulateBeginStroke();
      await user.click(screen.getByTestId("draw-pad-clear"));
      await waitFor(() => {
        expect(
          screen.getByTestId("draw-pad-confirm-confirm")
        ).toHaveTextContent("Evet");
        expect(screen.getByTestId("draw-pad-confirm-cancel")).toHaveTextContent(
          "Hayır"
        );
      });
    });
  });

  // ── Fullscreen ──────────────────────────────────────────────────────────────

  describe("fullscreen", () => {
    beforeEach(() => {
      (document as any).fullscreenElement = null;
      HTMLDivElement.prototype.requestFullscreen = jest.fn(() =>
        Promise.resolve()
      );
      document.exitFullscreen = jest.fn(() => Promise.resolve());
    });

    it("calls requestFullscreen when fullscreen button clicked", async () => {
      const user = userEvent.setup();
      render(<DrawPad showFullscreen />);
      await user.click(screen.getByTestId("draw-pad-fullscreen"));
      expect(HTMLDivElement.prototype.requestFullscreen).toHaveBeenCalledTimes(
        1
      );
    });

    it("shows Maximize icon when not fullscreen", () => {
      render(<DrawPad showFullscreen />);
      expect(screen.getByTestId("lucide-maximize2")).toBeInTheDocument();
    });

    it("shows Minimize icon when fullscreen is active", () => {
      render(<DrawPad showFullscreen />);
      act(() => {
        (document as any).fullscreenElement = screen.getByTestId("draw-pad");
        document.dispatchEvent(new Event("fullscreenchange"));
      });
      expect(screen.getByTestId("lucide-minimize2")).toBeInTheDocument();
    });

    it("calls exitFullscreen when fullscreen button clicked while fullscreen", async () => {
      const user = userEvent.setup();
      render(<DrawPad showFullscreen />);
      // Enter fullscreen
      act(() => {
        (document as any).fullscreenElement = screen.getByTestId("draw-pad");
        document.dispatchEvent(new Event("fullscreenchange"));
      });
      await user.click(screen.getByTestId("draw-pad-fullscreen"));
      expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
    });
  });

  // ── Drawing visibility ──────────────────────────────────────────────────────

  describe("button visibility while drawing", () => {
    it("button group has opacity-0 class during a stroke", () => {
      render(<DrawPad showClear />);
      // Before drawing — no opacity-0
      expect(
        screen.getByTestId("draw-pad-clear").closest("div")
      ).not.toHaveClass("opacity-0");
      simulateBeginStroke();
      expect(screen.getByTestId("draw-pad-clear").closest("div")).toHaveClass(
        "opacity-0"
      );
    });

    it("button group restores opacity after stroke ends", () => {
      render(<DrawPad showClear />);
      simulateBeginStroke();
      simulateEndStroke();
      expect(screen.getByTestId("draw-pad-clear").closest("div")).toHaveClass(
        "opacity-100"
      );
    });
  });

  // ── Event callbacks ─────────────────────────────────────────────────────────

  describe("event callbacks", () => {
    it("calls onBegin when stroke begins", () => {
      const onBegin = jest.fn();
      render(<DrawPad onBegin={onBegin} />);
      simulateBeginStroke();
      expect(onBegin).toHaveBeenCalledTimes(1);
    });

    it("calls onEnd with dataUrl when stroke ends", () => {
      const onEnd = jest.fn();
      render(<DrawPad onEnd={onEnd} />);
      simulateBeginStroke();
      simulateEndStroke();
      expect(onEnd).toHaveBeenCalledWith("data:image/png;base64,MOCK");
    });
  });

  // ── Ref / DrawPadHandle ─────────────────────────────────────────────────────

  describe("ref / DrawPadHandle", () => {
    it("exposes clear via ref", () => {
      const ref = createRef<DrawPadHandle>();
      render(<DrawPad ref={ref} />);
      ref.current!.clear();
      expect(fakePad.clear).toHaveBeenCalledTimes(1);
    });

    it("exposes isEmpty via ref", () => {
      const ref = createRef<DrawPadHandle>();
      render(<DrawPad ref={ref} />);
      expect(ref.current!.isEmpty()).toBe(true);
      expect(fakePad.isEmpty).toHaveBeenCalled();
    });

    it("exposes toDataURL via ref", () => {
      const ref = createRef<DrawPadHandle>();
      render(<DrawPad ref={ref} />);
      const result = ref.current!.toDataURL();
      expect(result).toBe("data:image/png;base64,MOCK");
    });

    it("exposes toSVG via ref", () => {
      const ref = createRef<DrawPadHandle>();
      render(<DrawPad ref={ref} />);
      expect(ref.current!.toSVG()).toBe("<svg></svg>");
    });

    it("exposes fromDataURL via ref", () => {
      const ref = createRef<DrawPadHandle>();
      render(<DrawPad ref={ref} />);
      ref.current!.fromDataURL("data:image/png;base64,TEST");
      expect(fakePad.fromDataURL).toHaveBeenCalledWith(
        "data:image/png;base64,TEST"
      );
    });

    it("exposes download via ref", () => {
      global.URL.createObjectURL = jest.fn(() => "blob:mock");
      global.URL.revokeObjectURL = jest.fn();
      const clickSpy = jest
        .spyOn(HTMLAnchorElement.prototype, "click")
        .mockImplementation(() => {});
      const ref = createRef<DrawPadHandle>();
      render(<DrawPad ref={ref} />);
      simulateBeginStroke();
      ref.current!.download("svg");
      expect(fakePad.toSVG).toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    it("exposes toggleFullscreen via ref", () => {
      HTMLDivElement.prototype.requestFullscreen = jest.fn(() =>
        Promise.resolve()
      );
      (document as any).fullscreenElement = null;
      const ref = createRef<DrawPadHandle>();
      render(<DrawPad ref={ref} showFullscreen />);
      ref.current!.toggleFullscreen();
      expect(HTMLDivElement.prototype.requestFullscreen).toHaveBeenCalledTimes(
        1
      );
    });

    it("exposes setPenColor via ref", () => {
      const ref = createRef<DrawPadHandle>();
      render(<DrawPad ref={ref} />);
      act(() => ref.current!.setPenColor("#7c3aed"));
      expect((fakePad as any).penColor).toBe("#7c3aed");
    });

    it("exposes setPenThickness via ref", () => {
      const ref = createRef<DrawPadHandle>();
      render(<DrawPad ref={ref} />);
      act(() => ref.current!.setPenThickness(9));
      expect((fakePad as any).maxWidth).toBe(9);
      expect((fakePad as any).minWidth).toBeCloseTo(2.7);
    });
  });

  // ── Pen color picker ────────────────────────────────────────────────────────

  describe("pen color picker", () => {
    it("shows pen color button when showPenColor is true", () => {
      render(<DrawPad showPenColor />);
      expect(screen.getByTestId("draw-pad-pen-color")).toBeInTheDocument();
    });

    it("does not show pen color button by default", () => {
      render(<DrawPad />);
      expect(
        screen.queryByTestId("draw-pad-pen-color")
      ).not.toBeInTheDocument();
    });

    it("opens color popover when pen color button clicked", async () => {
      const user = userEvent.setup();
      render(<DrawPad showPenColor />);
      await user.click(screen.getByTestId("draw-pad-pen-color"));
      await waitFor(() =>
        expect(
          screen.getByTestId("draw-pad-pen-color-popover")
        ).toBeInTheDocument()
      );
    });

    it("shows 6 preset color swatches", async () => {
      const user = userEvent.setup();
      render(<DrawPad showPenColor />);
      await user.click(screen.getByTestId("draw-pad-pen-color"));
      await waitFor(() =>
        expect(
          screen.getByTestId("draw-pad-pen-color-popover")
        ).toBeInTheDocument()
      );
      [
        "#000000",
        "#ffffff",
        "#2563eb",
        "#dc2626",
        "#16a34a",
        "#7c3aed",
      ].forEach((c) => {
        expect(
          screen.getByTestId(`draw-pad-color-preset-${c}`)
        ).toBeInTheDocument();
      });
    });

    it("shows custom color input", async () => {
      const user = userEvent.setup();
      render(<DrawPad showPenColor />);
      await user.click(screen.getByTestId("draw-pad-pen-color"));
      await waitFor(() =>
        expect(screen.getByTestId("draw-pad-color-custom")).toBeInTheDocument()
      );
    });

    it("sets pen color on pad when preset is clicked", async () => {
      const user = userEvent.setup();
      render(<DrawPad showPenColor />);
      await user.click(screen.getByTestId("draw-pad-pen-color"));
      await waitFor(() =>
        expect(
          screen.getByTestId("draw-pad-color-preset-#2563eb")
        ).toBeInTheDocument()
      );
      await user.click(screen.getByTestId("draw-pad-color-preset-#2563eb"));
      expect((fakePad as any).penColor).toBe("#2563eb");
    });

    it("color custom input reflects selected color", async () => {
      const user = userEvent.setup();
      render(<DrawPad showPenColor />);
      await user.click(screen.getByTestId("draw-pad-pen-color"));
      await waitFor(() =>
        expect(
          screen.getByTestId("draw-pad-color-preset-#ffffff")
        ).toBeInTheDocument()
      );
      await user.click(screen.getByTestId("draw-pad-color-preset-#ffffff"));
      expect(screen.getByTestId("draw-pad-color-custom")).toHaveValue(
        "#ffffff"
      );
    });

    it("pen color button is disabled when disabled prop is true", () => {
      render(<DrawPad showPenColor disabled />);
      expect(screen.getByTestId("draw-pad-pen-color")).toBeDisabled();
    });
  });

  // ── Pen thickness picker ────────────────────────────────────────────────────

  describe("pen thickness picker", () => {
    it("shows pen thickness button when showPenThickness is true", () => {
      render(<DrawPad showPenThickness />);
      expect(screen.getByTestId("draw-pad-pen-thickness")).toBeInTheDocument();
    });

    it("does not show pen thickness button by default", () => {
      render(<DrawPad />);
      expect(
        screen.queryByTestId("draw-pad-pen-thickness")
      ).not.toBeInTheDocument();
    });

    it("opens thickness popover when pen thickness button clicked", async () => {
      const user = userEvent.setup();
      render(<DrawPad showPenThickness />);
      await user.click(screen.getByTestId("draw-pad-pen-thickness"));
      await waitFor(() =>
        expect(
          screen.getByTestId("draw-pad-pen-thickness-popover")
        ).toBeInTheDocument()
      );
    });

    it("shows 6 preset thickness buttons", async () => {
      const user = userEvent.setup();
      render(<DrawPad showPenThickness />);
      await user.click(screen.getByTestId("draw-pad-pen-thickness"));
      await waitFor(() =>
        expect(
          screen.getByTestId("draw-pad-pen-thickness-popover")
        ).toBeInTheDocument()
      );
      [1.5, 2.5, 4, 6, 9, 13].forEach((t) => {
        expect(
          screen.getByTestId(`draw-pad-thickness-preset-${t}`)
        ).toBeInTheDocument();
      });
    });

    it("shows custom range slider", async () => {
      const user = userEvent.setup();
      render(<DrawPad showPenThickness />);
      await user.click(screen.getByTestId("draw-pad-pen-thickness"));
      await waitFor(() =>
        expect(
          screen.getByTestId("draw-pad-thickness-custom")
        ).toBeInTheDocument()
      );
    });

    it("sets maxWidth and minWidth on pad when preset thickness clicked", async () => {
      const user = userEvent.setup();
      render(<DrawPad showPenThickness />);
      await user.click(screen.getByTestId("draw-pad-pen-thickness"));
      await waitFor(() =>
        expect(
          screen.getByTestId("draw-pad-thickness-preset-6")
        ).toBeInTheDocument()
      );
      await user.click(screen.getByTestId("draw-pad-thickness-preset-6"));
      expect((fakePad as any).maxWidth).toBe(6);
      expect((fakePad as any).minWidth).toBeCloseTo(1.8);
    });

    it("pen thickness button is disabled when disabled prop is true", () => {
      render(<DrawPad showPenThickness disabled />);
      expect(screen.getByTestId("draw-pad-pen-thickness")).toBeDisabled();
    });
  });
});
