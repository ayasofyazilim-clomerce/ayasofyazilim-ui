"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ayasofyazilim-ui/components/select";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";

export type LanguageOption = {
  code: string;
  label: string;
  flag?: React.ReactNode;
};

export type LanguageSwitcherLabels = {
  trigger?: string;
};

export type LanguageSwitcherProps = {
  languages: LanguageOption[];
  value: string;
  onValueChange: (code: string) => void;
  labels?: LanguageSwitcherLabels;
  disabled?: boolean;
  className?: string;
};

const defaultLabels: Required<LanguageSwitcherLabels> = {
  trigger: "Language",
};

function LanguageContent({
  flag,
  label,
  id,
}: {
  flag?: React.ReactNode;
  label: string;
  id?: string;
}) {
  return (
    <span id={id} className="flex items-center gap-2">
      {flag ? <span aria-hidden="true">{flag}</span> : null}
      <span>{label}</span>
    </span>
  );
}

export function LanguageSwitcher({
  languages,
  value,
  onValueChange,
  labels,
  disabled,
  className,
}: LanguageSwitcherProps) {
  const labelId = React.useId();
  const valueId = React.useId();
  if (languages.length < 2) return null;
  const text = { ...defaultLabels, ...labels };
  const current = languages.find((language) => language.code === value);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        aria-labelledby={`${labelId} ${valueId}`}
        className={cn("w-fit", className)}
      >
        <span id={labelId} className="sr-only">
          {text.trigger}
        </span>
        <SelectValue>
          <LanguageContent
            id={valueId}
            flag={current?.flag}
            label={current?.label ?? value}
          />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languages.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            <LanguageContent flag={language.flag} label={language.label} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
