"use client";

import { Check, ChevronDown, ChevronsUpDown, XIcon } from "lucide-react";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/command";
import { Popover, PopoverContent, PopoverTrigger } from "../components/popover";
import { Skeleton } from "../components/skeleton";
import { useDebounce } from "../hooks/use-debounce";
import { cn } from "../lib/utils";

export type SelectableProps<T> = {
  id?: string;
  className?: string;
  disabled?: boolean;
  options?: T[];
  defaultValue?: T[];
  getKey: (option: T) => string;
  getLabel: (option: T) => string;
  getGroup?: (option: T) => string;
  getDisabled?: (option: T) => boolean;
  onSearch?: (search: string) => Promise<T[]>;
  onChange: (value: T[]) => void;
  singular?: boolean;
  singleLine?: boolean;
  selectedText?: string;
  noResult?: string;
  searchPlaceholderText?: string;
  makeAChoiceText?: string;
  typeToSearchText?: string;
  renderOption?: (option: T) => React.ReactNode;
  renderTrigger?: ({
    children,
    disabled,
  }: {
    children: React.ReactNode;
    disabled: boolean;
  }) => React.ReactNode;
};

export function Selectable<T>({
  id,
  className,
  options,
  defaultValue,
  getKey,
  getLabel,
  getGroup,
  getDisabled,
  onSearch,
  onChange,
  singular = false,
  singleLine,
  selectedText = "Selected",
  noResult = "Nothing to show.",
  searchPlaceholderText = "Search...",
  makeAChoiceText = "Make a choice...",
  typeToSearchText = "Type to search...",
  disabled = false,
  renderOption,
  renderTrigger: Trigger,
}: SelectableProps<T>) {
  const [open, setOpen] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const searchValue = useDebounce(searchInput, 500);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<T[] | undefined>([]);

  const [selectedOptions, setSelectedOptions] = useState<T[] | undefined>(
    defaultValue
  );

  const selectableOptions = useMemo(() => {
    const sourceOptions = onSearch && searchValue ? searchResults : options;
    const selectableOptions =
      sourceOptions?.filter(
        (option) =>
          !selectedOptions?.some(
            (selected) => getKey(selected) === getKey(option)
          )
      ) || [];

    if (!getGroup)
      return { groupedOptions: { "": selectableOptions }, sortedTypes: [""] };
    const groupedOptions: Record<string, T[]> = {};
    selectableOptions.forEach((option) => {
      const type = getGroup(option);
      if (!groupedOptions[type]) {
        groupedOptions[type] = [];
      }
      groupedOptions[type].push(option);
    });
    const sortedTypes = Object.keys(groupedOptions).sort();

    return { groupedOptions, sortedTypes };
  }, [selectedOptions, searchResults, options, searchValue, getKey, getGroup]);

  const toggleSelection = useCallback(
    (option: T, isSelected: boolean) => {
      // Prevent selection of disabled options
      if (getDisabled?.(option)) return;

      if (singular) {
        const newSelection = isSelected ? [option] : [];
        setSelectedOptions(newSelection);
        onChange(newSelection);
        setOpen(false);
        return;
      }
      setSelectedOptions((prev) => {
        const newSelection = isSelected
          ? [...(prev || []), option]
          : prev?.filter((item) => getKey(item) !== getKey(option)) || [];
        onChange(newSelection);
        return newSelection;
      });
    },
    [singular, getKey, getDisabled, onChange]
  );

  const handleSearchChange = useCallback((search: string) => {
    setSearching(!!search);
    setSearchInput(search);
  }, []);

  useEffect(() => {
    if (!onSearch) {
      setSearching(false);
      setSearchResults([]);
      return;
    }
    if (searchValue !== searchInput) return;

    setSearching(true);
    setSearchResults([]);
    onSearch(searchValue)
      .then((fetchedOptions) => {
        setSearchResults(fetchedOptions);
      })
      .finally(() => {
        setSearching(false);
      });
  }, [onSearch, searchValue, searchInput]);

  const onPopoverOpenChange = useCallback(
    (isOpen: boolean) => {
      if (disabled) return;
      setOpen(isOpen);
      setSearchInput("");
    },
    [disabled]
  );

  const TriggerContent = (
    <>
      {selectedOptions?.length ? (
        <div className={"flex flex-wrap gap-1 overflow-hidden w-full"}>
          {!singleLine &&
            selectedOptions.map((option) => {
              const key = getKey(option);
              const label = getLabel(option);
              if (singular) {
                return <Fragment key={key}>{label}</Fragment>;
              }

              return (
                <Badge
                  key={key}
                  variant={"secondary"}
                  className="hover:animate-pulse"
                  onClick={(e) => {
                    if (disabled) return;
                    e.stopPropagation();
                    toggleSelection(option, false);
                  }}
                >
                  {label}
                  <XIcon className="size-4" />
                </Badge>
              );
            })}
          {singleLine && (
            <span className="truncate">
              {selectedOptions.map((option) => getLabel(option)).join(", ")}
            </span>
          )}
        </div>
      ) : (
        makeAChoiceText
      )}
      <ChevronsUpDown className="opacity-50" />
    </>
  );
  return (
    <Popover open={open} onOpenChange={onPopoverOpenChange}>
      <PopoverTrigger
        id={id}
        className={cn(
          "w-full justify-between h-max hover:bg-accent/30",
          className
        )}
        disabled={disabled}
        asChild
      >
        {Trigger ? (
          <span>
            <Trigger disabled={disabled}>{TriggerContent}</Trigger>
          </span>
        ) : (
          <Button variant="outline" disabled={disabled}>
            {TriggerContent}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput
            placeholder={searchPlaceholderText}
            className="h-9"
            onValueChange={(search) => handleSearchChange(search)}
          />
          <CommandList>
            {searching && (
              <div className="p-1 text-sm">
                <Skeleton className="h-7 w-full mb-1" />
                <Skeleton className="h-7 w-full mb-1" />
                <Skeleton className="h-7 w-full mb-1" />
              </div>
            )}
            {!searching && !!selectedOptions?.length && (
              <Collapsible className="border-b">
                <CollapsibleTrigger asChild>
                  <CommandGroup
                    className="[&[data-state=open]_svg]:-rotate-90 cursor-pointer"
                    heading={
                      <div className="flex justify-between">
                        {selectedText}
                        <ChevronDown className="size-4 transition-all" />
                      </div>
                    }
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-1">
                  {selectedOptions.map((option) => {
                    const key = getKey(option);
                    const isDisabled = getDisabled?.(option) ?? false;
                    return (
                      <CommandItem
                        id={"option-" + key}
                        key={key}
                        value={key}
                        disabled={isDisabled}
                        onSelect={() => toggleSelection(option, false)}
                      >
                        {renderOption ? (
                          renderOption(option)
                        ) : (
                          <>
                            {getLabel(option)}
                            <Check className="ml-auto opacity-100" />
                          </>
                        )}
                      </CommandItem>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}
            {!searching && (
              <CommandEmpty id="no-result-text">
                {onSearch && !options?.length && !searchValue
                  ? typeToSearchText
                  : noResult}
              </CommandEmpty>
            )}
            {!searching &&
              selectableOptions.sortedTypes?.map((group) => (
                <CommandGroup key={group} heading={group}>
                  {selectableOptions.groupedOptions[group]?.map((option) => {
                    const key = getKey(option);
                    const isDisabled = getDisabled?.(option) ?? false;
                    return (
                      <CommandItem
                        id={"option-" + key}
                        key={key}
                        value={getLabel(option)}
                        disabled={isDisabled}
                        onSelect={() => toggleSelection(option, true)}
                      >
                        {getLabel(option)}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
