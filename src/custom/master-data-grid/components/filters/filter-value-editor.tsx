"use client";

import { useState } from "react";
import { Badge } from "../../../../components/badge";
import { Field, FieldError, FieldLabel } from "../../../../components/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../../../../components/input-group";
import { DatePicker, DateRangePicker } from "../../../date-picker";
import { Selectable } from "../../../selectable";
import { X, XCircle } from "lucide-react";
import type { ServerFilterConfig } from "../../types";
import type { ServerFilterValue } from "../../utils/server-filter-utils";

export interface FilterValueEditorProps {
  filter: ServerFilterConfig;
  value: ServerFilterValue | undefined;
  locale?: string;
  error?: string;
  resetSignal?: number;
  commitOnBlur?: boolean;
  onChange: (value: ServerFilterValue | undefined) => void;
  onCommit?: () => void;
}

export function FilterValueEditor({
  filter,
  value,
  locale,
  error,
  resetSignal = 0,
  commitOnBlur = false,
  onChange,
  onCommit,
}: FilterValueEditorProps) {
  const [clearCount, setClearCount] = useState(0);
  const label = <FieldLabel htmlFor={filter.key}>{filter.label}</FieldLabel>;
  const err = error ? <FieldError>{error}</FieldError> : null;

  if (filter.type === "date") {
    const current = value as string | undefined;
    return (
      <Field
        key={`${filter.key}-${resetSignal}-${clearCount}`}
        className="gap-1"
      >
        {label}
        <div className="relative">
          <DatePicker
            id={filter.key}
            locale={locale}
            defaultValue={current ? new Date(current) : undefined}
            onChange={(date) => {
              onChange(date ? date.toISOString() : undefined);
              onCommit?.();
            }}
          />
          {current && (
            <button
              type="button"
              className="absolute right-9 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setClearCount((prev) => prev + 1);
                onChange(undefined);
                onCommit?.();
              }}
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>
        {err}
      </Field>
    );
  }

  if (filter.type === "date-range") {
    const range = (value as { from?: string; to?: string } | undefined) ?? {};
    return (
      <Field
        key={`${filter.key}-${resetSignal}-${clearCount}`}
        className="gap-1"
      >
        {label}
        <div className="relative">
          <DateRangePicker
            id={filter.key}
            locale={locale}
            defaultValues={{
              start: range.from ? new Date(range.from) : undefined,
              end: range.to ? new Date(range.to) : undefined,
            }}
            onChange={(next) => {
              onChange({
                from: next.start?.toISOString(),
                to: next.end?.toISOString(),
              });
              onCommit?.();
            }}
          />
          {(range.from || range.to) && (
            <button
              type="button"
              className="absolute right-9 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setClearCount((prev) => prev + 1);
                onChange(undefined);
                onCommit?.();
              }}
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>
        {err}
      </Field>
    );
  }

  if (filter.type === "string-array") {
    const tags = (value as string[] | undefined) ?? [];
    return (
      <Field className="gap-1">
        {label}
        <InputGroup>
          <InputGroupInput
            id={filter.key}
            type="text"
            placeholder={filter.placeholder}
            className={error ? "border-destructive" : ""}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              const input = event.currentTarget;
              const trimmed = input.value.trim();
              if (trimmed && !tags.includes(trimmed)) {
                onChange([...tags, trimmed]);
              }
              input.value = "";
            }}
          />
        </InputGroup>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                {tag}
                <button
                  type="button"
                  className="ml-1 rounded-full hover:bg-muted"
                  onClick={() => onChange(tags.filter((t) => t !== tag))}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        {err}
      </Field>
    );
  }

  if (
    filter.type === "select" ||
    filter.type === "array" ||
    filter.type === "boolean"
  ) {
    const selected = filter.options.filter((option) =>
      Array.isArray(value)
        ? value.some((entry) => String(entry) === String(option.value))
        : String(value) === String(option.value)
    );
    return (
      <Field className="gap-1">
        {label}
        <Selectable
          id={filter.key}
          key={`${filter.key}-${resetSignal}`}
          singular={filter.type !== "array"}
          options={filter.options}
          defaultValue={selected}
          getKey={(option) => String(option.value)}
          getLabel={(option) => option.label}
          onChange={(picked) => {
            const values = picked.map((option) => option.value);
            onChange(
              filter.type === "array"
                ? (values as string[])
                : (values[0] as ServerFilterValue | undefined)
            );
            onCommit?.();
          }}
          searchPlaceholderText={filter.placeholder}
          makeAChoiceText={filter.placeholder}
        />
        {err}
      </Field>
    );
  }

  const text =
    typeof value === "string" || typeof value === "number" ? value : "";
  return (
    <Field className="gap-1">
      {label}
      <InputGroup>
        <InputGroupInput
          id={filter.key}
          type={filter.type === "number" ? "number" : "text"}
          value={text}
          placeholder={filter.placeholder}
          onChange={(event) =>
            onChange(
              event.target.value === "" ? undefined : event.target.value
            )
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onCommit?.();
            }
          }}
          onBlur={() => commitOnBlur && onCommit?.()}
          className={error ? "border-destructive" : ""}
        />
        {text !== "" && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton onClick={() => onChange(undefined)}>
              <XCircle />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
      {err}
    </Field>
  );
}
