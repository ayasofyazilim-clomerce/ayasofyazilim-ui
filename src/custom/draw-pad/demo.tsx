"use client";

import { Button } from "@repo/ayasofyazilim-ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ayasofyazilim-ui/components/card";
import { useRef, useState } from "react";
import {
  DEFAULT_DRAW_PAD_TRANSLATIONS,
  DrawPad,
  type DrawPadHandle,
  type DrawPadTranslations,
  type DownloadFormat,
} from "@repo/ayasofyazilim-ui/custom/draw-pad";

// --- Turkish translations ---
const TR_TRANSLATIONS: DrawPadTranslations = {
  "DrawPad.clear": "İmzayı temizle",
  "DrawPad.download": "İmzayı indir",
  "DrawPad.fullscreen": "Tam ekran",
  "DrawPad.exitFullscreen": "Tam ekrandan çık",
  "DrawPad.clearConfirm.title": "İmzayı temizle?",
  "DrawPad.clearConfirm.description":
    "Bu işlem imzanızı kalıcı olarak silecek. Geri alınamaz.",
  "DrawPad.clearConfirm.confirmLabel": "Temizle",
  "DrawPad.clearConfirm.cancelLabel": "İptal",
  "DrawPad.download.pngTransparent": "PNG (Şeffaf)",
  "DrawPad.download.pngWhite": "PNG (Beyaz)",
  "DrawPad.download.jpeg": "JPEG",
  "DrawPad.download.svg": "SVG",
  "DrawPad.penColor": "Kalem rengi",
  "DrawPad.penThickness": "Kalem kalınlığı",
  "DrawPad.customColor": "Özel renk",
};

// --- Types ---
type LogEntry = {
  id: number;
  type: "begin" | "end" | "clear" | "download";
  detail?: string;
  ts: string;
};
let logId = 0;

// --- Section wrapper ---
function Section({
  title,
  description,
  prop,
  children,
  fullWidth,
}: {
  title: string;
  description: string;
  prop?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <Card className={fullWidth ? "col-span-full" : undefined}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="flex flex-col gap-1">
          <span>{description}</span>
          {prop && (
            <code className="w-fit rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {prop}
            </code>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// --- Disabled toggle demo ---
function DisabledDemo() {
  const [disabled, setDisabled] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <DrawPad
        disabled={disabled}
        showPenColor
        showPenThickness
        showClear
        showDownload
        showFullscreen
      />
      <Button
        variant={disabled ? "default" : "outline"}
        size="sm"
        className="self-start"
        onClick={() => setDisabled((v) => !v)}
      >
        {disabled ? "Enable" : "Disable"}
      </Button>
    </div>
  );
}

// --- Event log demo ---
const EVENT_COLORS: Record<LogEntry["type"], string> = {
  begin: "text-blue-500",
  end: "text-green-600",
  clear: "text-orange-500",
  download: "text-purple-500",
};

function EventLogDemo() {
  const [events, setEvents] = useState<LogEntry[]>([]);

  const push = (type: LogEntry["type"], detail?: string) =>
    setEvents((prev) => [
      {
        id: logId++,
        type,
        detail,
        ts: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      },
      ...prev.slice(0, 29),
    ]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <DrawPad
        showPenColor
        showPenThickness
        showClear
        showDownload
        showFullscreen
        clearConfirm
        onBegin={() => push("begin")}
        onEnd={(dataUrl) => push("end", `${dataUrl.length} chars`)}
        onClear={() => push("clear")}
        onDownload={(format) => push("download", format)}
      />
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Event log
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setEvents([])}
          >
            Clear log
          </Button>
        </div>
        <div className="h-52 space-y-1 overflow-y-auto rounded-md border bg-muted/50 p-3 font-mono text-xs">
          {events.length === 0 ? (
            <span className="text-muted-foreground">
              Draw on the pad to see events…
            </span>
          ) : (
            events.map((e) => (
              <div key={e.id} className="flex gap-2">
                <span className="shrink-0 text-muted-foreground">{e.ts}</span>
                <span
                  className={`shrink-0 font-semibold ${EVENT_COLORS[e.type]}`}
                >
                  {e.type}
                </span>
                {e.detail && (
                  <span className="truncate text-muted-foreground">
                    {e.detail}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// --- Programmatic ref demo ---
const REF_FORMATS: DownloadFormat[] = [
  "png-transparent",
  "png-white",
  "jpeg",
  "svg",
];

const PRESET_COLORS = [
  { label: "Black", value: "#000000" },
  { label: "Blue", value: "#2563eb" },
  { label: "Red", value: "#dc2626" },
  { label: "Green", value: "#16a34a" },
  { label: "Purple", value: "#7c3aed" },
  { label: "Orange", value: "#ea580c" },
];

const PRESET_THICKNESSES = [1.5, 4, 9, 13];

function RefDemo() {
  const padRef = useRef<DrawPadHandle>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const act = (label: string, fn: () => void) => {
    fn();
    setLastAction(label);
    setTimeout(() => setIsEmpty(padRef.current?.isEmpty() ?? true), 0);
  };

  return (
    <div className="flex flex-col gap-4">
      <DrawPad
        ref={padRef}
        onEnd={() => setIsEmpty(false)}
        onClear={() => setIsEmpty(true)}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isEmpty}
          onClick={() => act("clear()", () => padRef.current?.clear())}
        >
          ref.clear()
        </Button>
        {REF_FORMATS.map((f) => (
          <Button
            key={f}
            variant="outline"
            size="sm"
            disabled={isEmpty}
            onClick={() =>
              act(`download("${f}")`, () => padRef.current?.download(f))
            }
          >
            ref.download("{f}")
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            act("toggleFullscreen()", () => padRef.current?.toggleFullscreen())
          }
        >
          ref.toggleFullscreen()
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            act(`isEmpty() → ${padRef.current?.isEmpty()}`, () => {})
          }
        >
          ref.isEmpty()
        </Button>
        {PRESET_COLORS.map((c) => (
          <Button
            key={c.value}
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() =>
              act(`setPenColor("${c.value}")`, () =>
                padRef.current?.setPenColor(c.value)
              )
            }
          >
            <span
              className="inline-block h-3 w-3 rounded-full border"
              style={{ backgroundColor: c.value }}
            />
            {c.label}
          </Button>
        ))}
        {PRESET_THICKNESSES.map((t) => (
          <Button
            key={t}
            variant="outline"
            size="sm"
            onClick={() =>
              act(`setPenThickness(${t})`, () =>
                padRef.current?.setPenThickness(t)
              )
            }
          >
            ref.setPenThickness({t})
          </Button>
        ))}
      </div>
      {lastAction && (
        <p className="font-mono text-xs text-muted-foreground">
          → {lastAction}
        </p>
      )}
    </div>
  );
}

// --- Page ---

export function DrawPadDemo() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">DrawPad — Demo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All configurable use cases.{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            Buttons auto-hide while drawing.
          </code>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* 1 — Default: canvas only */}
        <Section
          title="Default"
          description="No props — pure canvas, no buttons."
          prop="<DrawPad />"
        >
          <DrawPad />
        </Section>

        {/* 2 — Pen color picker */}
        <Section
          title="Pen Color Picker"
          description="6 presets + custom color input. Indicator dot shows current color."
          prop="showPenColor"
        >
          <DrawPad showPenColor showFullscreen />
        </Section>

        {/* 3 — Pen thickness picker */}
        <Section
          title="Pen Thickness Picker"
          description="6 preset weights + custom range slider (1–20px)."
          prop="showPenThickness"
        >
          <DrawPad showPenThickness showFullscreen />
        </Section>

        {/* 4 — Pen controls combined */}
        <Section
          title="Pen Controls"
          description="Color + thickness pickers together — the full drawing toolbar."
          prop="showPenColor showPenThickness showFullscreen"
        >
          <DrawPad showPenColor showPenThickness showFullscreen />
        </Section>

        {/* 5 — All buttons */}
        <Section
          title="All Buttons"
          description="Color · Thickness · Eraser · Download · Fullscreen — all five grouped top-right."
          prop="showPenColor showPenThickness showClear showDownload showFullscreen"
        >
          <DrawPad
            showPenColor
            showPenThickness
            showClear
            showDownload
            showFullscreen
          />
        </Section>

        {/* 6 — Clear confirmation */}
        <Section
          title="Clear Confirmation"
          description="Prompts before erasing. Buttons still hide while drawing."
          prop="showClear clearConfirm showFullscreen"
        >
          <DrawPad showClear clearConfirm showFullscreen />
        </Section>

        {/* 7 — Download only */}
        <Section
          title="Download Only"
          description="No eraser exposed — user can only save."
          prop="showDownload showFullscreen"
        >
          <DrawPad showDownload showFullscreen />
        </Section>

        {/* 8 — Custom filename */}
        <Section
          title="Custom Download Filename"
          description='Files save as "traveller-signature.*".'
          prop='showDownload downloadFileName="traveller-signature"'
        >
          <DrawPad
            showDownload
            showFullscreen
            downloadFileName="traveller-signature"
          />
        </Section>

        {/* 9 — Disabled toggle */}
        <Section
          title="Disabled State"
          description="Canvas and all buttons non-interactive. Toggle to test."
          prop="disabled"
        >
          <DisabledDemo />
        </Section>

        {/* 10 — Turkish translations */}
        <Section
          title="Custom Translations (Turkish)"
          description="All UI strings localised including pen controls. Clear confirmation enabled."
          prop="translations={TR_TRANSLATIONS} clearConfirm"
        >
          <DrawPad
            showPenColor
            showPenThickness
            showClear
            showDownload
            showFullscreen
            clearConfirm
            translations={TR_TRANSLATIONS}
          />
        </Section>

        {/* 11 — Partial override */}
        <Section
          title="Partial Translation Override"
          description="Spread defaults and replace only the labels you need."
          prop='{ ...DEFAULT_DRAW_PAD_TRANSLATIONS, "DrawPad.penColor": "Ink", "DrawPad.penThickness": "Weight" }'
        >
          <DrawPad
            showPenColor
            showPenThickness
            showClear
            showDownload
            showFullscreen
            translations={{
              ...DEFAULT_DRAW_PAD_TRANSLATIONS,
              "DrawPad.penColor": "Ink",
              "DrawPad.penThickness": "Weight",
              "DrawPad.clear": "Erase it",
              "DrawPad.download": "Save it",
            }}
          />
        </Section>

        {/* 12 — Custom className */}
        <Section
          title="Custom className"
          description="className applied to the outer container."
          prop='className="border-2 border-dashed border-blue-300 bg-blue-50/50"'
        >
          <DrawPad
            showPenColor
            showPenThickness
            showClear
            showDownload
            showFullscreen
            className="border-2 border-dashed border-blue-300 bg-blue-50/50"
          />
        </Section>

        {/* 13 — Event log (full width) */}
        <Section
          title="Event Handlers"
          description="onBegin · onEnd(dataUrl) · onClear · onDownload(format, data) — live event log."
          prop="onBegin onEnd onClear onDownload"
          fullWidth
        >
          <EventLogDemo />
        </Section>

        {/* 14 — Programmatic ref (full width) */}
        <Section
          title="Programmatic Control via Ref"
          description="DrawPadHandle exposes clear · isEmpty · toDataURL · toSVG · fromDataURL · toData · download · toggleFullscreen · setPenColor · setPenThickness."
          prop="ref={padRef}"
          fullWidth
        >
          <RefDemo />
        </Section>
      </div>
    </div>
  );
}
