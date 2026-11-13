"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/ayasofyazilim-ui/components/alert";
import { Button } from "@repo/ayasofyazilim-ui/components/button";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import * as React from "react";

export type CountdownRemaining = {
  totalSeconds: number;
  formatted: string;
};

export type CountdownNoticeProps = {
  until: Date | number;
  title?: React.ReactNode;
  description: (remaining: CountdownRemaining) => React.ReactNode;
  elapsed?: React.ReactNode;
  onElapsed?: () => void;
  onRetry?: () => void;
  labels?: { retry?: string };
  variant?: "default" | "destructive" | "warning" | "information";
  className?: string;
};

/** Formats seconds as "m:ss", or "h:mm:ss" from one hour up. Bad input gives "0:00". */
export function formatCountdown(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds)
    ? Math.max(0, Math.floor(totalSeconds))
    : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${ss}`;
  return `${minutes}:${ss}`;
}

function secondsUntil(untilMs: number): number {
  if (!Number.isFinite(untilMs)) return 0;
  return Math.max(0, Math.ceil((untilMs - Date.now()) / 1000));
}

export function CountdownNotice({
  until,
  title,
  description,
  elapsed,
  onElapsed,
  onRetry,
  labels,
  variant = "warning",
  className,
}: CountdownNoticeProps) {
  const untilMs = typeof until === "number" ? until : until.getTime();
  const [totalSeconds, setTotalSeconds] = React.useState(() =>
    secondsUntil(untilMs),
  );
  const firedRef = React.useRef(false);
  const onElapsedRef = React.useRef(onElapsed);
  React.useEffect(() => {
    onElapsedRef.current = onElapsed;
  });

  React.useEffect(() => {
    firedRef.current = false;
    let id: ReturnType<typeof setInterval> | undefined;
    const tick = () => {
      const next = secondsUntil(untilMs);
      setTotalSeconds(next);
      if (next === 0) {
        if (id !== undefined) clearInterval(id);
        id = undefined;
        if (!firedRef.current) {
          firedRef.current = true;
          onElapsedRef.current?.();
        }
      }
    };
    tick();
    if (!firedRef.current) id = setInterval(tick, 1000);
    return () => {
      if (id !== undefined) clearInterval(id);
    };
  }, [untilMs]);

  const isElapsed = totalSeconds === 0;

  return (
    // The ticking text must not be announced every second, so drop the default role="alert".
    <Alert role={undefined} variant={variant} className={cn(className)}>
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription>
        {isElapsed ? (
          <div role="status">{elapsed}</div>
        ) : (
          <span suppressHydrationWarning>
            {description({
              totalSeconds,
              formatted: formatCountdown(totalSeconds),
            })}
          </span>
        )}
        {isElapsed && onRetry ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={onRetry}
          >
            {labels?.retry ?? "Retry"}
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
