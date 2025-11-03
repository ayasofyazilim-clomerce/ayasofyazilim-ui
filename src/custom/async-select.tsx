"use client";

import { CheckIcon, ChevronDown, XCircle, XIcon } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Badge } from "@repo/ayasofyazilim-ui/components/badge";
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

type SearchItem = { id: string; name: string };

function CommandGroupItem({
  items,
  id,
  title,
  onChange,
  value,
  multiple,
}: {
  title: string;
  id: string;
  items: SearchItem[];
  value: SearchItem[];
  onChange: (value: SearchItem[]) => void;
  multiple: boolean;
}) {
  return (
    <CommandGroup heading={title}>
      {items?.map((currentItem, index) => (
        <CommandItem
          id={`${id}_${index}`}
          key={currentItem.id}
          onSelect={() => {
            if (value.find((i) => i.id === currentItem.id)) {
              return onChange(value.filter((i) => i.id !== currentItem.id));
            }
            if (multiple) {
              return onChange([...value, currentItem]);
            }
            return onChange([currentItem]);
          }}
          value={currentItem.name}
        >
          {currentItem.name}
          {value.find((i) => i.id === currentItem.id) && (
            <CheckIcon className={cn("ml-auto h-4 w-4")} />
          )}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

export type AsyncSelectType = {
  suggestions?: SearchItem[];
  data?: SearchItem[];
  value: SearchItem[];
  onChange: (value: SearchItem[]) => void;
  fetchAction: (search: string) => Promise<SearchItem[]>;
  resultText?: string;
  searchText?: string;
  noResultText?: string;
  disabled?: boolean;
  closeOnSelect?: boolean;
  multiple?: boolean;
  id: string;
  classNames?: {
    trigger?: string;
  };
};

export function AsyncSelectBase({
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
  setIsPopoverOpen,
}: Omit<AsyncSelectType, "classNames"> & {
  setIsPopoverOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const searchValue = useDebounce(searchInput, 500);

  const [items, setItems] = useState<SearchItem[]>(data || []);
  const showableItems = items.filter(
    (item) => !value.find((i) => i.id === item.id),
  );
  const showableSuggestions = suggestions.filter(
    (item) => !value.find((i) => i.id === item.id),
  );

  function onSearch(search: string) {
    setSearchInput(search);
    setLoading(true);
    setItems([]);
  }
  function handleOnChange(value: SearchItem[]) {
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
    <Cmd className="border" aria-disabled={disabled}>
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
            value={value}
            title="Selected"
            onChange={(value) => {
              handleOnChange(value);
              if (closeOnSelect) setIsPopoverOpen(false);
            }}
            multiple={multiple}
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
          />
        )}
      </CommandList>
    </Cmd>
  );
}
export default function AsyncSelect(props: AsyncSelectType) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild className="w-full">
        <Button
          id={props.id}
          data-testid={props.id}
          type="button"
          onClick={() => setIsPopoverOpen(true)}
          className={cn(
            "flex w-full p-1 rounded-md border min-h-10 h-auto items-center justify-between bg-inherit hover:bg-inherit",
            props.classNames?.trigger,
          )}
        >
          {props.value.length > 0 ? (
            <div className="flex justify-between items-center w-full">
              <div className="flex flex-wrap items-center">
                {props.value.slice(0, 3).map((value) => (
                  <Badge
                    key={value.id}
                    className="m-1 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300 border-foreground/10 text-foreground bg-card hover:bg-card/80"
                  >
                    {value.name}
                    <XCircle
                      className="ml-2 h-4 w-4 cursor-pointer"
                      onClick={() => {
                        props.onChange(
                          props.value.filter((i) => i.id !== value.id),
                        );
                      }}
                    />
                  </Badge>
                ))}
                {props.value.length > 3 && (
                  <Badge
                    className={cn(
                      "bg-transparent text-foreground border-foreground/1 hover:bg-transparent",
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
              <span className="text-sm text-black mx-3 font-normal">
                {props.searchText}
              </span>
              <ChevronDown className="h-4 cursor-pointer text-muted-foreground mx-2" />
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        onEscapeKeyDown={() => setIsPopoverOpen(false)}
      >
        <AsyncSelectBase {...props} setIsPopoverOpen={setIsPopoverOpen} />
      </PopoverContent>
    </Popover>
  );
}
