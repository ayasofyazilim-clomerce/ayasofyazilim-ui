"use client";

import { CheckIcon, ChevronDown, XCircle, XIcon } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Badge, BadgeVariant } from "@repo/ayasofyazilim-ui/components/badge";
import { Button } from "@repo/ayasofyazilim-ui/components/button";
import {
  Command as Cmd,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ayasofyazilim-ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ayasofyazilim-ui/components/popover";
import { Separator } from "@repo/ayasofyazilim-ui/components/separator";
import { Skeleton } from "@repo/ayasofyazilim-ui/components/skeleton";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { useDebounce } from "../hooks/use-debounce";

export type SearchItem = Record<string, unknown>;

export type BadgeConfig<T extends SearchItem = SearchItem> = {
  key: (keyof T & string) | string;
  variant?: BadgeVariant;
  className?: string;
  value?: (item: T) => string | number;
};

function CommandGroupItem<T extends SearchItem>({
  items,
  id,
  title,
  onChange,
  value,
  multiple,
  identifierKey,
  labelKey,
  badges,
  itemClassName,
  itemContainerClassName,
}: {
  title: string;
  id: string;
  items: T[];
  value: T[];
  onChange: (value: T[]) => void;
  multiple: boolean;
  identifierKey: keyof T & string;
  labelKey: keyof T & string;
  badges?: BadgeConfig<T>[];
  itemClassName?: string;
  itemContainerClassName?: string;
}) {
  return (
    <CommandGroup heading={title}>
      {items?.map((currentItem, index) => {
        const itemId = String(currentItem[identifierKey] ?? "");
        const itemLabel = String(currentItem[labelKey] ?? "");
        const isSelected = value.find(
          (i) => String(i[identifierKey]) === itemId
        );
        return (
          <CommandItem
            id={`${id}_${index}`}
            key={itemId}
            onSelect={() => {
              if (isSelected) {
                return onChange(
                  value.filter((i) => String(i[identifierKey]) !== itemId)
                );
              }
              if (multiple) {
                return onChange([...value, currentItem]);
              }
              return onChange([currentItem]);
            }}
            value={`${itemId}__${itemLabel}`}
            className={itemContainerClassName}
          >
            <div className={itemClassName}>
              <span>{itemLabel}</span>
              {badges?.map((badge) => {
                const badgeValue = badge.value
                  ? badge.value(currentItem)
                  : currentItem[badge.key];
                if (
                  badgeValue === undefined ||
                  badgeValue === null ||
                  badgeValue === ""
                )
                  return null;
                return (
                  <Badge
                    key={badge.key}
                    variant={badge.variant ?? "outline"}
                    className={cn("text-xs", badge.className)}
                  >
                    {String(badgeValue)}
                  </Badge>
                );
              })}
            </div>
            {isSelected && <CheckIcon className={cn("ml-auto h-4 w-4")} />}
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}

export type AsyncSelectType<T extends SearchItem = SearchItem> = {
  suggestions?: T[];
  data?: T[];
  value: T[];
  onChange: (value: T[]) => void;
  fetchAction: (search: string) => Promise<T[]>;
  resultText?: string;
  searchText?: string;
  noResultText?: string;
  disabled?: boolean;
  closeOnSelect?: boolean;
  multiple?: boolean;
  id: string;
  /** Key used to uniquely identify each item. Defaults to `"id"`. */
  identifierKey?: keyof T & string;
  /** Key used as the display label for each item. Defaults to `"name"`. */
  labelKey?: keyof T & string;
  /** Extra fields to render as badges inside each dropdown item. */
  badges?: BadgeConfig<T>[];
  classNames?: {
    trigger?: string;
    item?: string;
    itemContainer?: string;
  };
};

export function AsyncSelectBase<T extends SearchItem = SearchItem>({
  suggestions = [],
  data,
  value,
  fetchAction,
  onChange,
  resultText = "Results",
  searchText = "Search",
  noResultText = "No result",
  disabled = false,
  multiple = true,
  closeOnSelect = false,
  id,
  identifierKey = "id" as keyof T & string,
  labelKey = "name" as keyof T & string,
  badges,
  setIsPopoverOpen,
  classNames,
}: AsyncSelectType<T> & {
  setIsPopoverOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const searchValue = useDebounce(searchInput, 500);

  const [items, setItems] = useState<T[]>(data || []);
  const showableItems = items.filter(
    (item) =>
      !value.find(
        (i) => String(i[identifierKey]) === String(item[identifierKey])
      )
  );
  const showableSuggestions = suggestions.filter(
    (item) =>
      !value.find(
        (i) => String(i[identifierKey]) === String(item[identifierKey])
      )
  );
  function onSearch(search: string) {
    setSearchInput(search);
    setLoading(true);
    setItems([]);
  }
  function handleOnChange(value: T[]) {
    if (disabled) return;
    onChange(value);
  }

  useEffect(() => {
    if (searchValue === "" && searchInput === "") {
      setLoading(true);
      fetchAction("").then((res) => {
        setItems(res);
        setLoading(false);
      });
      return;
    }
    if (searchValue !== searchInput) return;

    fetchAction(searchValue).then((res) => {
      setItems(res);
      setLoading(false);
    });
  }, [searchValue, searchInput, fetchAction]);

  return (
    <Cmd aria-disabled={disabled} shouldFilter={false}>
      <CommandInput
        id={`${id}_input`}
        data-testid={`${id}_input`}
        placeholder={searchText}
        onValueChange={(search) => onSearch(search)}
        disabled={disabled}
      />

      <CommandList className="overflow-y-auto max-h-48">
        {loading && (
          <div className="p-1 text-sm">
            <Skeleton className="h-7 w-full mb-1" />
          </div>
        )}

        {!loading && items.length === 0 && searchValue.length > 0 && (
          <div className="text-sm p-2">{noResultText}</div>
        )}

        {value.length > 0 && (
          <CommandGroupItem
            items={value}
            id={`${id}_selected`}
            data-testid={`${id}_selected`}
            value={value}
            title="Selected"
            onChange={(value) => {
              handleOnChange(value);
              if (closeOnSelect) setIsPopoverOpen(false);
            }}
            multiple={multiple}
            identifierKey={identifierKey}
            labelKey={labelKey}
            badges={badges}
            itemClassName={classNames?.item}
            itemContainerClassName={classNames?.itemContainer}
          />
        )}

        {!loading &&
          searchValue.length === 0 &&
          showableSuggestions?.length > 0 && (
            <CommandGroupItem
              id={`${id}_item`}
              items={showableSuggestions}
              value={value}
              title="Suggestions"
              onChange={(value) => {
                handleOnChange(value);
                if (closeOnSelect) setIsPopoverOpen(false);
              }}
              multiple={multiple}
              identifierKey={identifierKey}
              labelKey={labelKey}
              badges={badges}
              itemClassName={classNames?.item}
              itemContainerClassName={classNames?.itemContainer}
            />
          )}

        {!loading && showableItems.length > 0 && (
          <CommandGroupItem
            id={`${id}_item`}
            items={showableItems}
            value={value}
            title={resultText}
            onChange={(value) => {
              handleOnChange(value);
              if (closeOnSelect) setIsPopoverOpen(false);
            }}
            multiple={multiple}
            identifierKey={identifierKey}
            labelKey={labelKey}
            badges={badges}
            itemClassName={classNames?.item}
            itemContainerClassName={classNames?.itemContainer}
          />
        )}
      </CommandList>
    </Cmd>
  );
}
export default function AsyncSelect<T extends SearchItem = SearchItem>(
  props: AsyncSelectType<T>
) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const identifierKey = (props.identifierKey ?? "id") as keyof T & string;
  const labelKey = (props.labelKey ?? "name") as keyof T & string;
  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild className="w-full">
        <Button
          id={props.id}
          data-testid={props.id}
          disabled={props.disabled}
          type="button"
          onClick={() => setIsPopoverOpen(true)}
          className={cn(
            "flex w-full p-1 rounded-md border items-center justify-between bg-inherit hover:bg-inherit",
            props.classNames?.trigger
          )}
        >
          {props.value.length > 0 ? (
            <div className="flex justify-between items-center w-full">
              <div className="flex flex-wrap items-center">
                {props.value.slice(0, 3).map((value) => {
                  const itemId = String(value[identifierKey] ?? "");
                  const itemLabel = String(value[labelKey] ?? "");
                  return (
                    <Badge
                      key={itemId}
                      data-testid={`${props.id}_badge_${itemLabel}`}
                      className="m-1 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300 border-foreground/10 text-foreground bg-card hover:bg-card/80"
                      onClick={() => {
                        props.onChange(
                          props.value.filter(
                            (i) => String(i[identifierKey]) !== itemId
                          )
                        );
                      }}
                    >
                      {itemLabel}
                      <XCircle className="ml-2 h-4 w-4 cursor-pointer" />
                    </Badge>
                  );
                })}
                {props.value.length > 3 && (
                  <Badge
                    className={cn(
                      "bg-transparent text-foreground border-foreground/1 hover:bg-transparent"
                    )}
                  >
                    {props.value.length - 3} more
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <XIcon
                  className="h-4 mx-2 cursor-pointer text-muted-foreground"
                  onClick={() => {
                    props.onChange([]);
                  }}
                />
                <Separator
                  orientation="vertical"
                  className="flex min-h-6 h-full"
                />
                <ChevronDown className="h-4 mx-2 cursor-pointer text-muted-foreground" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full mx-auto">
              <span className="text-sm text-background mx-3 font-normal">
                {props.searchText}
              </span>
              <ChevronDown className="h-4 cursor-pointer text-muted-foreground mx-2" />
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        onEscapeKeyDown={() => setIsPopoverOpen(false)}
      >
        <AsyncSelectBase {...props} setIsPopoverOpen={setIsPopoverOpen} />
      </PopoverContent>
    </Popover>
  );
}
