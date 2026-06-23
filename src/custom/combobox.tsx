"use client";

import {
  CheckIcon,
  ChevronsUpDown,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ayasofyazilim-ui/components/tooltip";

export type ComboboxBadgeOptions<T> = {
  className?: string;
  label: (item: T) => React.ReactNode;
};

export type ComboboxLinkOptions<T> = {
  /** Where the link icon is rendered. Defaults to "both". */
  linkLocation?: "trigger" | "item" | "both";
  /** Opens the link in a new tab. Defaults to true. */
  openInNewTab?: boolean;
  /** Icon shown for the link. Defaults to the `ExternalLink` icon. */
  linkIcon?: LucideIcon;
  /** Optional tooltip shown on hover of the link icon. */
  tooltip?: string;
  /** Builds the href from the item, e.g. `(item) => `/tr/${item.id}/details``. */
  linkBuilder: (values: T) => string;
  className?: string;
  /** Optional condition to determine if the link should be rendered. */
  condition?: (item: T) => boolean;
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
  /** Identifier values of items that should be rendered disabled. */
  disabledItems?: T[keyof T][];
  /** Renders link icons (built from the item) in the trigger and/or each item. */
  link?: Partial<Record<keyof T, ComboboxLinkOptions<T>>>;
  /** Replaces the default label/badge/link content of each item. */
  customItemRenderer?: (item: T) => React.ReactNode;
};

function ComboboxLinks<T>({
  item,
  link,
  location,
  testIdPrefix,
}: {
  item: T;
  link: Partial<Record<keyof T, ComboboxLinkOptions<T>>>;
  location: "trigger" | "item";
  testIdPrefix: string;
}) {
  const entries = (Object.keys(link) as (keyof T)[])
    .map((key) => [key, link[key]] as const)
    .filter((entry): entry is readonly [keyof T, ComboboxLinkOptions<T>] => {
      const options = entry[1];
      if (!options) return false;
      if (options.condition && !options.condition(item)) return false;
      const linkLocation = options.linkLocation ?? "both";
      return linkLocation === "both" || linkLocation === location;
    });
  if (entries.length === 0) return null;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1",
        location === "item" && "ml-auto"
      )}
    >
      {entries.map(([key, options]) => {
        const Icon = options.linkIcon ?? ExternalLink;
        const openInNewTab = options.openInNewTab !== false;
        const anchor = (
          <a
            data-testid={`${testIdPrefix}-link-${String(key)}`}
            href={options.linkBuilder(item)}
            target={openInNewTab ? "_blank" : undefined}
            rel={openInNewTab ? "noopener noreferrer" : undefined}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className={cn(
              "text-muted-foreground hover:text-foreground inline-flex items-center justify-center rounded p-0.5 transition-colors",
              options.className
            )}
          >
            <Icon className="h-4 w-4" />
          </a>
        );
        if (options.tooltip) {
          return (
            <Tooltip key={String(key)}>
              <TooltipTrigger asChild>{anchor}</TooltipTrigger>
              <TooltipContent>{options.tooltip}</TooltipContent>
            </Tooltip>
          );
        }
        return <span key={String(key)}>{anchor}</span>;
      })}
    </div>
  );
}

export function Combobox<T>(props: ComboboxProps<T>) {
  const {
    id,
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
    link,
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

  const triggerLink =
    link && currentValue ? (
      <ComboboxLinks
        item={currentValue}
        link={link}
        location="trigger"
        testIdPrefix={id ?? "combobox"}
      />
    ) : null;

  const fieldValue =
    (list?.find(
      (x: T) => x[props.selectIdentifier] === currentValue?.[selectIdentifier]
    )?.[props.selectLabel] as string) ||
    emptyValue ||
    (label && `Please select an ${label.toLocaleLowerCase()}`) ||
    "Please select";
  const DesktopContent = (
    <Popover open={open} onOpenChange={setOpen} modal>
      <div className="flex w-full items-center gap-1">
        <PopoverTrigger asChild className="min-w-0 flex-1">
          <Button
            id={id}
            data-testid={id}
            disabled={disabled}
            type="button"
            variant="outline"
            role="combobox"
            className={cn(
              "text-muted-foreground w-full justify-between font-normal",
              currentValue && "text-foreground",
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
        {triggerLink}
      </div>
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
      <div className="flex w-full items-center gap-1">
        <DrawerTrigger asChild className="min-w-0 flex-1">
          <Button
            id={id}
            data-testid={id}
            disabled={disabled}
            type="button"
            variant="outline"
            className={cn(
              "text-muted-foreground w-full justify-between font-normal",
              currentValue && "text-foreground",
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
        {triggerLink}
      </div>
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
    link,
    disabledItems,
    customItemRenderer,
  } = props;

  return (
    <Command
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
        data-testid={id ? `${id}_search` : undefined}
        placeholder={searchPlaceholder || "Search..."}
        className="h-9"
      />
      <CommandList className="w-full min-w-full max-w-full">
        <CommandEmpty>{searchResultLabel || "0 search result."}</CommandEmpty>
        <CommandGroup>
          {list?.map((item: T, index) => (
            <CommandItem
              data-testid={id ? `${id}_${index}` : undefined}
              disabled={disabledItems?.includes(item[selectIdentifier])}
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
              {customItemRenderer ? (
                customItemRenderer(item)
              ) : (
                <>
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
                  {link && (
                    <ComboboxLinks
                      item={item}
                      link={link}
                      location="item"
                      testIdPrefix={id ? `${id}_${index}` : `combobox_${index}`}
                    />
                  )}
                </>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
