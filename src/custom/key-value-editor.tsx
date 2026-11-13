"use client";

import { useId } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@repo/ayasofyazilim-ui/components/button";
import { Input } from "@repo/ayasofyazilim-ui/components/input";
import { Switch } from "@repo/ayasofyazilim-ui/components/switch";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";

export type KeyValueRow = {
  id: string;
  key: string;
  value: string;
  secret?: boolean;
};

export type KeyValueEditorLabels = {
  key?: string;
  value?: string;
  secret?: string;
  add?: string;
  remove?: (index: number) => string;
  duplicateKey?: string;
};

export type KeyValueEditorProps = {
  value: KeyValueRow[];
  onValueChange: (rows: KeyValueRow[]) => void;
  allowSecret?: boolean;
  maxRows?: number;
  disabled?: boolean;
  labels?: KeyValueEditorLabels;
  className?: string;
  classNames?: { row?: string; key?: string; value?: string };
};

const DEFAULT_LABELS = {
  key: "Key",
  value: "Value",
  secret: "Secret",
  add: "Add",
  remove: (index: number) => `Remove row ${index + 1}`,
  duplicateKey: "Duplicate key",
};

let rowCounter = 0;

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  rowCounter += 1;
  return `kv-${Date.now().toString(36)}-${rowCounter}`;
}

export function createKeyValueRow(
  init: Partial<Omit<KeyValueRow, "id">> = {}
): KeyValueRow {
  return { key: "", value: "", ...init, id: newId() };
}

export function KeyValueEditor({
  value,
  onValueChange,
  allowSecret,
  maxRows,
  disabled,
  labels,
  className,
  classNames,
}: KeyValueEditorProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const baseId = useId();

  const counts = new Map<string, number>();
  value.forEach((row) => {
    const k = row.key.trim();
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
  });

  const update = (id: string, patch: Partial<Omit<KeyValueRow, "id">>) =>
    onValueChange(value.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const atMax = maxRows !== undefined && value.length >= maxRows;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {value.map((row, index) => {
        const duplicate = (counts.get(row.key.trim()) ?? 0) > 1;
        const messageId = `${baseId}-dup-${row.id}`;
        return (
          <div key={row.id} className="flex flex-col gap-1">
            <div className={cn("flex items-center gap-2", classNames?.row)}>
              <Input
                aria-label={text.key}
                aria-invalid={duplicate ? true : undefined}
                aria-describedby={duplicate ? messageId : undefined}
                autoComplete="off"
                className={cn("flex-1", classNames?.key)}
                disabled={disabled}
                value={row.key}
                onChange={(e) => update(row.id, { key: e.target.value })}
              />
              <Input
                aria-label={text.value}
                className={cn("flex-1", classNames?.value)}
                disabled={disabled}
                value={row.value}
                onChange={(e) => update(row.id, { value: e.target.value })}
                {...(row.secret
                  ? {
                      type: "password",
                      autoComplete: "new-password",
                      "data-1p-ignore": true,
                      "data-lpignore": true,
                    }
                  : { autoComplete: "off" })}
              />
              {allowSecret && (
                <Switch
                  aria-label={text.secret}
                  checked={!!row.secret}
                  disabled={disabled}
                  onCheckedChange={(checked) =>
                    update(row.id, { secret: checked })
                  }
                />
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={text.remove(index)}
                disabled={disabled}
                onClick={() =>
                  onValueChange(value.filter((r) => r.id !== row.id))
                }
              >
                <Trash2 aria-hidden className="size-4" />
              </Button>
            </div>
            {duplicate && (
              <p id={messageId} className="text-destructive text-xs">
                {text.duplicateKey}
              </p>
            )}
          </div>
        );
      })}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || atMax}
          onClick={() => onValueChange([...value, createKeyValueRow()])}
        >
          <Plus aria-hidden className="size-4" />
          {text.add}
        </Button>
      </div>
    </div>
  );
}
