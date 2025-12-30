"use client";

import { CheckIcon, ChevronsUpDown } from "lucide-react";
import React, { Dispatch, SetStateAction, useState } from "react";
import { Button } from "@repo/ayasofyazilim-ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ayasofyazilim-ui/components/command";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@repo/ayasofyazilim-ui/components/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ayasofyazilim-ui/components/popover";
import { useMediaQuery } from "@repo/ayasofyazilim-ui/hooks/use-media-query";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { Label } from "@repo/ayasofyazilim-ui/components/label";
import { Badge } from "@repo/ayasofyazilim-ui/components/badge";

export type ComboboxBadgeOptions<T> = {
  className?: string;
  label: (item: T) => React.ReactNode;
};

export type ComboboxProps<T> = {
  id?: string;
  disabled?: boolean;
  emptyValue?: string;
  errorMessage?: string;
  classNames?: {
    container?: string;
    label?: string;
    trigger?: {
      button?: string;
      label?: string;
      icon?: string;
    };
    list?: {
      label?: string;
    };
    error?: string;
    required?: string;
  };
  label?: string;
  list: Array<T> | null | undefined;
  onValueChange?: (
    value: T | null | undefined
  ) => void | Dispatch<SetStateAction<T | null | undefined>>;
  required?: boolean;
  searchPlaceholder?: string;
  searchResultLabel?: string;
  selectIdentifier: keyof T;
  selectLabel: keyof T;
  value?: T | null | undefined;
  defaultValue?: T | null | undefined;
  badges?: Partial<Record<keyof T, ComboboxBadgeOptions<T>>>;
};

export function Combobox<T>(props: ComboboxProps<T>) {
  const {
    label,
    list,
    value: controlledValue,
    defaultValue,
    disabled,
    selectIdentifier,
    required,
    errorMessage,
    emptyValue,
    classNames,
    onValueChange,
  } = props;
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useState(false);

  const [internalValue, setInternalValue] = useState<T | null | undefined>(
    defaultValue ?? null
  );

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const handleValueChange = (newValue: T | null | undefined) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  const fieldValue =
    (list?.find(
      (x: T) => x[props.selectIdentifier] === currentValue?.[selectIdentifier]
    )?.[props.selectLabel] as string) ||
    emptyValue ||
    (label && `Please select an ${label.toLocaleLowerCase()}`) ||
    "Please select";
  const DesktopContent = (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          type="button"
          variant="outline"
          role="combobox"
          className={cn(
            "text-muted-foreground w-full justify-between font-normal",
            currentValue && "text-black",
            classNames?.trigger?.button
          )}
        >
          <span
            className={cn(
              "overflow-hidden truncate has-[role=dialog]:max-w-xs",
              classNames?.trigger?.label
            )}
          >
            {fieldValue}
          </span>
          <ChevronsUpDown
            className={cn(
              "ml-2 h-4 w-4 shrink-0 opacity-50",
              classNames?.trigger?.icon
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <List
          {...props}
          setOpen={setOpen}
          currentValue={currentValue}
          handleValueChange={handleValueChange}
        />
      </PopoverContent>
    </Popover>
  );

  const MobileContent = (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          disabled={disabled}
          type="button"
          variant="outline"
          className={cn(
            "text-muted-foreground w-full justify-between font-normal",
            currentValue && "text-black",
            classNames?.trigger?.button
          )}
        >
          <span className={cn("truncate", classNames?.trigger?.label)}>
            {fieldValue}
          </span>
          <ChevronsUpDown
            className={cn(
              "ml-2 h-4 w-4 shrink-0 opacity-50",
              classNames?.trigger?.icon
            )}
          />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mt-4 border-t">
          <List
            {...props}
            setOpen={setOpen}
            currentValue={currentValue}
            handleValueChange={handleValueChange}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );

  const Content = isDesktop ? DesktopContent : MobileContent;

  return (
    <div className={cn("w-full", classNames?.container)}>
      {label && (
        <Label className={classNames?.label}>
          {label}
          {required && (
            <span className={cn("text-destructive", classNames?.required)}>
              *
            </span>
          )}
        </Label>
      )}
      {Content}
      {errorMessage && (
        <span
          className={cn(
            "text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-destructive",
            classNames?.error
          )}
        >
          {errorMessage}
        </span>
      )}
    </div>
  );
}

function List<T>({
  setOpen,
  currentValue,
  handleValueChange,
  ...props
}: ComboboxProps<T> & {
  setOpen: (open: boolean) => void;
  currentValue: T | null | undefined;
  handleValueChange: (value: T | null | undefined) => void;
}) {
  const {
    list,
    selectIdentifier,
    selectLabel,
    searchPlaceholder,
    searchResultLabel,
    id,
    classNames,
    badges,
  } = props;

  return (
    <Command
      id={id}
      filter={(value, search) => {
        const filterResult = list?.find(
          (i) =>
            (i[selectIdentifier] as string)?.toLocaleLowerCase() ===
            value.toLocaleLowerCase()
        )?.[selectLabel] as string;
        if (
          value.includes(search) ||
          filterResult?.toLocaleLowerCase().includes(search.toLocaleLowerCase())
        )
          return 1;
        return 0;
      }}
    >
      <CommandInput
        placeholder={searchPlaceholder || "Search..."}
        className="h-9"
      />
      <CommandList className="w-full min-w-full max-w-full">
        <CommandEmpty>{searchResultLabel || "0 search result."}</CommandEmpty>
        <CommandGroup>
          {list?.map((item: T) => (
            <CommandItem
              onSelect={() => {
                handleValueChange(item);
                setOpen(false);
              }}
              key={JSON.stringify(item[selectIdentifier])}
              value={item[selectIdentifier] as string}
            >
              {item[selectIdentifier] === currentValue?.[selectIdentifier] && (
                <CheckIcon className={cn("h-4 w-4")} />
              )}
              <span className={cn(classNames?.list?.label)}>
                {item[selectLabel] as string}
              </span>
              {badges && (
                <div className="ml-auto">
                  {Object.keys(badges).map((badgeKey) => {
                    const badgeOptions = badges[badgeKey as keyof T];
                    if (!badgeOptions) return null;
                    return (
                      <Badge
                        key={badgeKey}
                        variant="outline"
                        className={cn("ml-2", badgeOptions.className)}
                      >
                        {badgeOptions.label(item)}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
