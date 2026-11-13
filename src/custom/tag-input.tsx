"use client";

import { Badge } from "@repo/ayasofyazilim-ui/components/badge";
import { Input } from "@repo/ayasofyazilim-ui/components/input";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { X } from "lucide-react";
import React from "react";

export type TagInputLabels = {
  remove?: (tag: string) => string;
  duplicate?: string;
  maxReached?: string;
};

export type TagInputProps = {
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  allowDuplicates?: boolean;
  validate?: (tag: string) => string | null;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  labels?: TagInputLabels;
  className?: string;
  classNames?: { container?: string; chip?: string; input?: string };
};

export function TagInput({
  value,
  onValueChange,
  placeholder,
  maxItems,
  allowDuplicates = false,
  validate,
  disabled,
  id,
  "aria-label": ariaLabel,
  labels,
  className,
  classNames,
}: TagInputProps) {
  const [text, setText] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const removeLabel = labels?.remove ?? ((t: string) => `Remove ${t}`);
  const duplicateLabel = labels?.duplicate ?? "Already added";
  const maxReachedLabel = labels?.maxReached ?? "Maximum reached";

  // Adds the given raw entries in order. Returns true when nothing was
  // rejected (empty entries are skipped silently).
  function commit(entries: string[]) {
    let next = value;
    let error: string | null = null;
    for (const raw of entries) {
      const tag = raw.trim();
      if (!tag) continue;
      if (maxItems !== undefined && next.length >= maxItems) {
        error = maxReachedLabel;
        break;
      }
      if (!allowDuplicates && next.includes(tag)) {
        error = duplicateLabel;
        continue;
      }
      const invalid = validate?.(tag) ?? null;
      if (invalid) {
        error = invalid;
        continue;
      }
      next = [...next, tag];
    }
    if (next !== value) onValueChange(next);
    setMessage(error);
    return error === null;
  }

  function addText() {
    if (commit([text])) setText("");
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addText();
    } else if (event.key === "Backspace" && text === "" && value.length > 0) {
      onValueChange(value.slice(0, -1));
      setMessage(null);
    }
  }

  function onPaste(event: React.ClipboardEvent<HTMLInputElement>) {
    if (disabled) return;
    event.preventDefault();
    const [first = "", ...rest] = event.clipboardData
      .getData("text")
      .split(/[,\r\n]/);
    if (commit([text + first, ...rest])) setText("");
  }

  function removeTag(index: number) {
    if (disabled) return;
    onValueChange(value.filter((_, i) => i !== index));
    setMessage(null);
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div
        className={cn(
          "border-input dark:bg-input/30 flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border bg-transparent px-2 py-1",
          disabled && "cursor-not-allowed opacity-50",
          classNames?.container
        )}
      >
        {value.map((tag, index) => (
          <Badge
            key={`${tag}-${index}`}
            variant="secondary"
            className={classNames?.chip}
          >
            {tag}
            <button
              type="button"
              aria-label={removeLabel(tag)}
              disabled={disabled}
              onClick={() => removeTag(index)}
              className="hover:text-destructive inline-flex disabled:pointer-events-none"
            >
              <X />
            </button>
          </Badge>
        ))}
        <Input
          id={id}
          aria-label={ariaLabel}
          aria-invalid={message ? true : undefined}
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => {
            setText(event.target.value);
            setMessage(null);
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={() => {
            if (!disabled && text.trim()) addText();
          }}
          className={cn(
            "h-7 min-w-24 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 dark:bg-transparent",
            classNames?.input
          )}
        />
      </div>
      {message && (
        <p role="alert" className="text-destructive text-xs">
          {message}
        </p>
      )}
    </div>
  );
}
