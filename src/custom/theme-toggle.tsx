"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@repo/ayasofyazilim-ui/components/toggle-group";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";

export type ThemeValue = "system" | "light" | "dark";

export type ThemeToggleLabels = {
  group?: string;
  system?: string;
  light?: string;
  dark?: string;
};

export type ThemeToggleProps = {
  value?: ThemeValue;
  onValueChange?: (value: ThemeValue) => void;
  labels?: ThemeToggleLabels;
  iconOnly?: boolean;
  className?: string;
};

const defaultLabels: Required<ThemeToggleLabels> = {
  group: "Theme",
  system: "System",
  light: "Light",
  dark: "Dark",
};

const options = [
  { value: "system", icon: Monitor },
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
] as const;

const noopSubscribe = () => () => {};

function isThemeValue(value: unknown): value is ThemeValue {
  return value === "system" || value === "light" || value === "dark";
}

/**
 * Segmented system/light/dark control. Controlled when `value` is defined
 * (calls only `onValueChange`); otherwise it reads and writes next-themes.
 * Uncontrolled, nothing is selected until mounted, so the server HTML matches
 * the first client render.
 */
export function ThemeToggle({
  value,
  onValueChange,
  labels,
  iconOnly = false,
  className,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const text = { ...defaultLabels, ...labels };
  const controlled = value !== undefined;

  let selected = "";
  if (controlled) selected = value;
  else if (mounted && isThemeValue(theme)) selected = theme;

  function handleChange(next: string) {
    if (!isThemeValue(next) || next === selected) return;
    if (controlled) onValueChange?.(next);
    else setTheme(next);
  }

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      aria-label={text.group}
      value={selected}
      onValueChange={handleChange}
      className={cn(className)}
    >
      {options.map(({ value: optionValue, icon: Icon }) => (
        <ToggleGroupItem
          key={optionValue}
          value={optionValue}
          aria-label={iconOnly ? text[optionValue] : undefined}
        >
          <Icon aria-hidden="true" />
          {iconOnly ? null : <span>{text[optionValue]}</span>}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
