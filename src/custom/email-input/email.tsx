"use client";

import * as React from "react";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { Input } from "@repo/ayasofyazilim-ui/components/input";
import { Label } from "@repo/ayasofyazilim-ui/components/label";
import { Button } from "@repo/ayasofyazilim-ui/components/button";
import domains from "./domains.json";

interface EmailInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  suggestions?: string[];
  onValueChange?: (value: string) => void;
}

const EmailInput = React.forwardRef<HTMLInputElement, EmailInputProps>(
  (
    {
      id,
      className,
      label,
      suggestions = [],
      onValueChange,
      disabled,
      required,
      ...props
    },
    ref,
  ) => {
    const allSuggestions = React.useMemo(() => {
      const combined = [...domains, ...suggestions];
      return combined.filter((item, index) => combined.indexOf(item) === index);
    }, [suggestions]);

    const [value, setValue] = React.useState(props.value?.toString() || "");
    const [open, setOpen] = React.useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = React.useState<
      string[]
    >([]);
    const [selectedIndex, setSelectedIndex] = React.useState(-1);

    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current!);

    const updateSuggestions = React.useCallback(
      (inputValue: string) => {
        const atIndex = inputValue.lastIndexOf("@");

        if (atIndex === -1) {
          setOpen(false);
          setFilteredSuggestions([]);
          setSelectedIndex(-1);
          return;
        }

        const beforeAt = inputValue.substring(0, atIndex + 1);
        const afterAt = inputValue.substring(atIndex + 1);

        if (afterAt.length === 0) {
          const topSuggestions = allSuggestions
            .slice(0, 5)
            .map((domain) => beforeAt + domain);
          setFilteredSuggestions(topSuggestions);
          setOpen(true);
          setSelectedIndex(-1);
        } else {
          const filtered = allSuggestions
            .filter((domain) =>
              domain.toLowerCase().startsWith(afterAt.toLowerCase()),
            )
            .map((domain) => beforeAt + domain);

          if (filtered.length > 0) {
            setFilteredSuggestions(filtered);
            setOpen(true);
            setSelectedIndex(-1);
          } else {
            setOpen(false);
            setFilteredSuggestions([]);
            setSelectedIndex(-1);
          }
        }
      },
      [allSuggestions],
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      onValueChange?.(newValue);
      updateSuggestions(newValue);
    };

    const applySuggestion = (suggestion: string) => {
      setValue(suggestion);
      onValueChange?.(suggestion);
      setOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open || filteredSuggestions.length === 0) {
        if (e.key === "Escape") {
          setOpen(false);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (
            selectedIndex >= 0 &&
            selectedIndex < filteredSuggestions.length
          ) {
            applySuggestion(filteredSuggestions?.[selectedIndex] || "");
          }
          break;
        case "Escape":
          setOpen(false);
          setSelectedIndex(-1);
          break;
        default:
          setOpen(false);
          break;
      }
    };

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setOpen(false);
          setSelectedIndex(-1);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    React.useEffect(() => {
      if (props.value !== undefined) {
        setValue(props.value.toString());
      }
    }, [props.value]);

    return (
      <div className="w-full" ref={containerRef}>
        {label && (
          <Label
            className={cn(
              "mb-2 block",
              required &&
                "after:content-['*'] after:ml-0.5 after:text-destructive",
            )}
          >
            {label}
          </Label>
        )}

        <div className="relative">
          <Input
            type="email"
            id={id}
            data-testid={id}
            className={className}
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            required={required}
            {...props}
          />

          {open && filteredSuggestions.length > 1 && (
            <div className="absolute top-full left-0 right-0 z-999 mt-1 bg-popover border border-border rounded-md shadow-md">
              <div className="p-1 flex flex-col">
                {filteredSuggestions.map((suggestion, index) => (
                  <Button
                    variant="ghost"
                    data-testid={`${id}_suggestion_${index}`}
                    key={suggestion}
                    className={cn(
                      "w-full justify-start text-left px-2 py-1.5 text-sm cursor-pointer rounded-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      index === selectedIndex &&
                        "bg-accent text-accent-foreground",
                    )}
                    onClick={() => applySuggestion(suggestion)}
                  >
                    <span>{suggestion.split("@")[0]}</span>
                    <span className="text-primary font-semibold">
                      @{suggestion.split("@")[1]}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

EmailInput.displayName = "EmailInput";

export { EmailInput };
