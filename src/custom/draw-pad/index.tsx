"use client";

import { Label } from "@repo/ayasofyazilim-ui/components/label";
import { Button } from "../../components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/popover";
import { cn } from "../../lib/utils";
import {
  Download,
  Eraser,
  Maximize2,
  Minimize2,
  Palette,
  Pen,
} from "lucide-react";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react"; // Removed useEffect from here
import SignaturePad from "react-signature-pad-wrapper";
import React from "react";

type SignaturePadOptions = NonNullable<
  React.ComponentProps<typeof SignaturePad>["options"]
>;

const DEFAULT_OPTIONS: SignaturePadOptions = {
  minWidth: 1.5,
  maxWidth: 4,
  penColor: "black",
  backgroundColor: "rgba(0,0,0,0)",
  velocityFilterWeight: 0.7,
  throttle: 16,
};

const PRESET_COLORS = [
  "#000000",
  "#ffffff",
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#7c3aed",
] as const;

// maxWidth values; minWidth is derived as max(0.5, maxWidth * 0.3)
const PRESET_THICKNESSES = [1.5, 2.5, 4, 6, 9, 13] as const;

// --- Translations ---

export interface DrawPadTranslations {
  /** Aria-label for the clear (eraser) icon button. */
  "DrawPad.clear": string;
  /** Aria-label for the download icon button. */
  "DrawPad.download": string;
  /** Aria-label for the enter-fullscreen icon button. */
  "DrawPad.fullscreen": string;
  /** Aria-label for the exit-fullscreen icon button. */
  "DrawPad.exitFullscreen": string;
  /** Title of the clear confirmation dialog. */
  "DrawPad.clearConfirm.title": string;
  /** Body text of the clear confirmation dialog. */
  "DrawPad.clearConfirm.description": string;
  /** Destructive confirm button label in the clear dialog. */
  "DrawPad.clearConfirm.confirmLabel": string;
  /** Cancel button label in the clear dialog. */
  "DrawPad.clearConfirm.cancelLabel": string;
  /** Download format: PNG with transparent background. */
  "DrawPad.download.pngTransparent": string;
  /** Download format: PNG composited on white. */
  "DrawPad.download.pngWhite": string;
  /** Download format: JPEG (white background). */
  "DrawPad.download.jpeg": string;
  /** Download format: SVG vector. */
  "DrawPad.download.svg": string;
  /** Aria-label for the pen color picker button. */
  "DrawPad.penColor": string;
  /** Aria-label for the pen thickness picker button. */
  "DrawPad.penThickness": string;
  /** Label for the custom color picker in the pen color popover. */
  "DrawPad.customColor": string;
}

/** Default English translations — spread and override to localise. */
export const DEFAULT_DRAW_PAD_TRANSLATIONS: DrawPadTranslations = {
  "DrawPad.clear": "Clear signature",
  "DrawPad.download": "Download signature",
  "DrawPad.fullscreen": "Enter fullscreen",
  "DrawPad.exitFullscreen": "Exit fullscreen",
  "DrawPad.clearConfirm.title": "Clear signature?",
  "DrawPad.clearConfirm.description":
    "This will erase your current signature. This action cannot be undone.",
  "DrawPad.clearConfirm.confirmLabel": "Clear",
  "DrawPad.clearConfirm.cancelLabel": "Cancel",
  "DrawPad.download.pngTransparent": "PNG (Transparent)",
  "DrawPad.download.pngWhite": "PNG (White)",
  "DrawPad.download.jpeg": "JPEG",
  "DrawPad.download.svg": "SVG",
  "DrawPad.penColor": "Pen color",
  "DrawPad.penThickness": "Pen thickness",
  "DrawPad.customColor": "Custom color",
};

// --- Public types ---

export type DownloadFormat = "png-transparent" | "png-white" | "jpeg" | "svg";

export type DrawPadHandle = {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: (type?: string, encoderOptions?: number) => string;
  toSVG: () => string;
  fromDataURL: (dataUrl: string) => void;
  toData: () => ReturnType<InstanceType<typeof SignaturePad>["toData"]>;
  download: (format: DownloadFormat) => void;
  toggleFullscreen: () => void;
  setPenColor: (color: string) => void;
  setPenThickness: (maxWidth: number) => void;
};

export type DrawPadProps = {
  className?: string;
  options?: Partial<SignaturePadOptions>;
  width?: number;
  height?: number;
  redrawOnResize?: boolean;
  debounceInterval?: number;
  disabled?: boolean;
  translations?: DrawPadTranslations;
  /** Show eraser icon button. Default: false. */
  showClear?: boolean;
  /** Require confirmation before clearing. Default: false. */
  clearConfirm?: boolean;
  /** Show download icon button (with format dropdown). Default: false. */
  showDownload?: boolean;
  /** Base filename without extension when saving. Default: "signature". */
  downloadFileName?: string;
  /** Show fullscreen toggle icon button. Default: false. */
  showFullscreen?: boolean;
  /** Show pen color picker button. Default: false. */
  showPenColor?: boolean;
  /** Show pen thickness picker button. Default: false. */
  showPenThickness?: boolean;
  onBegin?: () => void;
  onEnd?: (dataUrl: string) => void;
  onClear?: () => void;
  onDownload?: (format: DownloadFormat, data: string) => void;
};

// --- Helpers ---

function triggerDownload(href: string, fileName: string, isBlob = false) {
  const a = document.createElement("a");
  a.href = href;
  a.download = fileName;
  a.click();
  if (isBlob) URL.revokeObjectURL(href);
}

function compositeOnWhite(source: HTMLCanvasElement): HTMLCanvasElement {
  const tmp = document.createElement("canvas");
  tmp.width = source.width;
  tmp.height = source.height;
  const ctx = tmp.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, tmp.width, tmp.height);
  ctx.drawImage(source, 0, 0);
  return tmp;
}

function scalePointData(
  data: ReturnType<InstanceType<typeof SignaturePad>["toData"]>,
  scaleX: number,
  scaleY: number
) {
  return data.map((group) => ({
    ...group,
    points: group.points.map((p) => ({
      ...p,
      x: p.x * scaleX,
      y: p.y * scaleY,
    })),
  }));
}

function deriveMinWidth(maxWidth: number) {
  return Math.max(0.5, maxWidth * 0.3);
}

// --- Component ---

export const DrawPad = forwardRef<DrawPadHandle, DrawPadProps>(function DrawPad(
  {
    className,
    options,
    width,
    height,
    redrawOnResize = true,
    debounceInterval = 150,
    disabled = false,
    translations = DEFAULT_DRAW_PAD_TRANSLATIONS,
    showClear = false,
    clearConfirm = false,
    showDownload = false,
    downloadFileName = "signature",
    showFullscreen = false,
    showPenColor = false,
    showPenThickness = false,
    onBegin,
    onEnd,
    onClear,
    onDownload,
  },
  ref
) {
  const padRef = useRef<InstanceType<typeof SignaturePad>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const preFsSize = useRef({ width: 0, height: 0 });

  const initialColor =
    (options?.penColor as string | undefined) ??
    (DEFAULT_OPTIONS.penColor as string);
  const initialMaxWidth = options?.maxWidth ?? DEFAULT_OPTIONS.maxWidth ?? 4;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [penColor, setPenColorState] = useState<string>(initialColor);
  const [penMaxWidth, setPenMaxWidthState] = useState<number>(initialMaxWidth);

  const t = translations;
  const mergedOptions: SignaturePadOptions = { ...DEFAULT_OPTIONS, ...options };

  const callbacksRef = useRef({ onBegin, onEnd, onClear, onDownload });
  callbacksRef.current = { onBegin, onEnd, onClear, onDownload };

  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingColorRef = useRef<string | null>(null);

  const applyPenColor = useCallback((color: string) => {
    setPenColorState(color);
    if (padRef.current) padRef.current.penColor = color;
  }, []);

  const handleCustomColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      pendingColorRef.current = newColor; // Always store the latest color

      // Clear any existing timeout to ensure we only have one pending update
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }

      // Schedule a new update after a short delay
      throttleTimeoutRef.current = setTimeout(() => {
        if (pendingColorRef.current !== null) {
          // Check if there's a pending color
          applyPenColor(pendingColorRef.current);
          pendingColorRef.current = null; // Clear pending color after applying
        }
        throttleTimeoutRef.current = null; // Reset timeout ref
      }, 50); // Throttle interval: 50ms. Adjust as needed.
    },
    [applyPenColor]
  );

  const applyPenThickness = useCallback((maxWidth: number) => {
    setPenMaxWidthState(maxWidth);
    if (padRef.current) {
      padRef.current.maxWidth = maxWidth;
      padRef.current.minWidth = deriveMinWidth(maxWidth);
    }
  }, []);

  const executeClear = useCallback(() => {
    padRef.current?.clear();
    setHasContent(false);
    callbacksRef.current.onClear?.();
  }, []);

  const requestClear = useCallback(() => {
    if (!clearConfirm) executeClear();
    else setConfirmOpen(true);
  }, [clearConfirm, executeClear]);

  const downloadAs = useCallback(
    (format: DownloadFormat) => {
      const pad = padRef.current;
      if (!pad) return;

      if (format === "svg") {
        const svg = pad.toSVG();
        const blob = new Blob([svg], { type: "image/svg+xml" });
        triggerDownload(
          URL.createObjectURL(blob),
          `${downloadFileName}.svg`,
          true
        );
        callbacksRef.current.onDownload?.(format, svg);
        return;
      }

      const canvas = pad.canvas.current;
      if (!canvas) return;

      if (format === "png-transparent") {
        const dataUrl = canvas.toDataURL("image/png");
        triggerDownload(dataUrl, `${downloadFileName}.png`);
        callbacksRef.current.onDownload?.(format, dataUrl);
        return;
      }

      const whitened = compositeOnWhite(canvas);
      const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
      const ext = format === "jpeg" ? "jpg" : "png";
      const dataUrl = whitened.toDataURL(mimeType, 0.95);
      triggerDownload(dataUrl, `${downloadFileName}.${ext}`);
      callbacksRef.current.onDownload?.(format, dataUrl);
    },
    [downloadFileName]
  );

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    preFsSize.current = {
      width: container.offsetWidth,
      height: container.offsetHeight,
    };
    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Attach stroke listeners once on mount — legitimate external subscription.
  // This useEffect is necessary for managing external DOM events from SignaturePad.
  // It's a proper use case for useEffect.
  // The throttling logic for color changes is handled by the useCallback, not here.
  // Also, the fullscreen listener is necessary for reacting to external browser events.
  // These are valid uses of useEffect for managing side effects tied to the component lifecycle.
  // We're keeping these, but removed the one for throttle cleanup.
  React.useEffect(() => {
    // Using React.useEffect explicitly for clarity
    const instance = padRef.current?.instance;
    if (!instance) return;

    const handleBegin = () => {
      setHasContent(true);
      setIsDrawing(true);
      callbacksRef.current.onBegin?.();
    };
    const handleEnd = () => {
      setIsDrawing(false);
      callbacksRef.current.onEnd?.(padRef.current?.toDataURL() ?? "");
    };

    instance.addEventListener("beginStroke", handleBegin);
    instance.addEventListener("endStroke", handleEnd);

    const onFsChange = () => {
      const pad = padRef.current;
      const container = containerRef.current;
      if (!pad || !container) return;

      const data = pad.toData();
      const { width: oldW, height: oldH } = preFsSize.current;
      setIsFullscreen(!!document.fullscreenElement);

      setTimeout(() => {
        pad.handleResize();
        if (!data.length || !oldW || !oldH) return;
        const newW = container.offsetWidth;
        const newH = container.offsetHeight;
        if (newW === oldW && newH === oldH) return;
        pad.fromData(scalePointData(data, newW / oldW, newH / oldH));
      }, 80);
    };

    document.addEventListener("fullscreenchange", onFsChange);

    return () => {
      instance.removeEventListener("beginStroke", handleBegin);
      instance.removeEventListener("endStroke", handleEnd);
      document.removeEventListener("fullscreenchange", onFsChange);

      // Cleanup for the color throttle timeout when the component unmounts
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
        // We don't necessarily need to apply the last pending color here on unmount
        // as the component is going away, and the signature pad instance might be gone.
        // If it's critical to ensure the *very last* color is set before destruction,
        // you might add a check here, but typically for a color picker on unmount, it's not.
      }
    };
  }, [applyPenColor]); // Included applyPenColor as a dependency for the cleanup of throttleTimeoutRef

  useImperativeHandle(ref, () => ({
    clear: executeClear,
    isEmpty: () => padRef.current?.isEmpty() ?? true,
    toDataURL: (type, encoderOptions) =>
      padRef.current?.toDataURL(type, encoderOptions) ?? "",
    toSVG: () => padRef.current?.toSVG() ?? "",
    fromDataURL: (dataUrl) => padRef.current?.fromDataURL(dataUrl),
    toData: () => padRef.current?.toData() ?? [],
    download: downloadAs,
    toggleFullscreen,
    setPenColor: applyPenColor,
    setPenThickness: applyPenThickness,
  }));

  const hasButtons =
    showClear ||
    showDownload ||
    showFullscreen ||
    showPenColor ||
    showPenThickness;

  return (
    <>
      <div
        ref={containerRef}
        data-testid="draw-pad"
        className={cn(
          "relative min-h-36 overflow-hidden rounded-md border bg-background",
          isFullscreen && "rounded-none border-none",
          disabled && "pointer-events-none opacity-60",
          className
        )}
      >
        <SignaturePad
          ref={padRef}
          width={width}
          height={height}
          options={mergedOptions}
          redrawOnResize={redrawOnResize}
          debounceInterval={debounceInterval}
        />

        {hasButtons && (
          <div
            className={cn(
              "absolute right-2 top-2 z-10 flex divide-x overflow-hidden rounded-md border bg-background/80 shadow-sm backdrop-blur-sm",
              "transition-opacity duration-150",
              isDrawing ? "pointer-events-none opacity-0" : "opacity-100"
            )}
          >
            {showPenColor && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    data-testid="draw-pad-pen-color"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-none"
                    disabled={disabled}
                    aria-label={t["DrawPad.penColor"]}
                    title={t["DrawPad.penColor"]}
                  >
                    <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                      <Palette className="h-3.5 w-3.5" />
                      <span
                        data-testid="draw-pad-pen-color-indicator"
                        className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full border shadow-sm"
                        style={{ backgroundColor: penColor }}
                      />
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-auto min-w-40 p-3"
                  data-testid="draw-pad-pen-color-popover"
                >
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-6 gap-1.5">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          data-testid={`draw-pad-color-preset-${c.slice(1)}`}
                          type="button"
                          className={cn(
                            "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            penColor === c
                              ? "border-foreground"
                              : "border-transparent"
                          )}
                          style={{ backgroundColor: c }}
                          aria-label={c}
                          onClick={() => applyPenColor(c)}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
                      <span>{t["DrawPad.customColor"]}</span>
                      <div
                        className="relative size-6 rounded-full border"
                        style={{ backgroundColor: penColor }}
                      >
                        <input
                          data-testid="draw-pad-color-custom"
                          type="color"
                          value={penColor}
                          className="size-6 opacity-0"
                          onChange={handleCustomColorChange}
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {showPenThickness && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    data-testid="draw-pad-pen-thickness"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-none"
                    disabled={disabled}
                    aria-label={t["DrawPad.penThickness"]}
                    title={t["DrawPad.penThickness"]}
                  >
                    <Pen className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-auto min-w-40 p-3"
                  data-testid="draw-pad-pen-thickness-popover"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-1">
                      {PRESET_THICKNESSES.map((t) => (
                        <button
                          key={t}
                          data-testid={`draw-pad-thickness-preset-${t}`}
                          type="button"
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded border-2 transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            penMaxWidth === t
                              ? "border-foreground bg-accent"
                              : "border-transparent"
                          )}
                          aria-label={`${t}px`}
                          onClick={() => applyPenThickness(t)}
                        >
                          <span
                            className="rounded-full bg-foreground"
                            style={{
                              width: Math.min(t * 1.5, 20),
                              height: Math.min(t * 1.5, 20),
                            }}
                          />
                        </button>
                      ))}
                    </div>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        Custom ({penMaxWidth.toFixed(1)}px)
                      </span>
                      <input
                        data-testid="draw-pad-thickness-custom"
                        type="range"
                        min={1}
                        max={20}
                        step={0.5}
                        value={penMaxWidth}
                        className="w-full cursor-pointer accent-foreground"
                        onChange={(e) =>
                          applyPenThickness(parseFloat(e.target.value))
                        }
                      />
                    </label>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {showClear && (
              <Button
                data-testid="draw-pad-clear"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-none"
                disabled={disabled || !hasContent}
                onClick={requestClear}
                aria-label={t["DrawPad.clear"]}
                title={t["DrawPad.clear"]}
              >
                <Eraser className="h-3.5 w-3.5" />
              </Button>
            )}

            {showDownload && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    data-testid="draw-pad-download"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-none"
                    disabled={disabled || !hasContent}
                    aria-label={t["DrawPad.download"]}
                    title={t["DrawPad.download"]}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      data-testid="draw-pad-download-png-transparent"
                      onClick={() => downloadAs("png-transparent")}
                    >
                      {t["DrawPad.download.pngTransparent"]}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      data-testid="draw-pad-download-png-white"
                      onClick={() => downloadAs("png-white")}
                    >
                      {t["DrawPad.download.pngWhite"]}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      data-testid="draw-pad-download-jpeg"
                      onClick={() => downloadAs("jpeg")}
                    >
                      {t["DrawPad.download.jpeg"]}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      data-testid="draw-pad-download-svg"
                      onClick={() => downloadAs("svg")}
                    >
                      {t["DrawPad.download.svg"]}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {showFullscreen && (
              <Button
                data-testid="draw-pad-fullscreen"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-none"
                onClick={toggleFullscreen}
                aria-label={
                  isFullscreen
                    ? t["DrawPad.exitFullscreen"]
                    : t["DrawPad.fullscreen"]
                }
                title={
                  isFullscreen
                    ? t["DrawPad.exitFullscreen"]
                    : t["DrawPad.fullscreen"]
                }
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {clearConfirm && (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent data-testid="draw-pad-confirm-dialog">
            <DialogHeader>
              <DialogTitle data-testid="draw-pad-confirm-title">
                {t["DrawPad.clearConfirm.title"]}
              </DialogTitle>
              <DialogDescription>
                {t["DrawPad.clearConfirm.description"]}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                data-testid="draw-pad-confirm-cancel"
                variant="outline"
                onClick={() => setConfirmOpen(false)}
              >
                {t["DrawPad.clearConfirm.cancelLabel"]}
              </Button>
              <Button
                data-testid="draw-pad-confirm-confirm"
                variant="destructive"
                onClick={() => {
                  executeClear();
                  setConfirmOpen(false);
                }}
              >
                {t["DrawPad.clearConfirm.confirmLabel"]}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
});

export * from "./demo";
