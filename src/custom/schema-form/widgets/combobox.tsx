import { ChevronsUpDown } from "lucide-react";
import { WidgetProps } from "@rjsf/utils";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
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
import { fieldOptionsByDependency } from "../utils/dependency";

export const Combobox = (props: WidgetProps) => {
  const { label, value, defaultValue, disabled, uiSchema, options, onChange } =
    props;
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useState(false);

  const fieldValue = value || defaultValue;
  const fieldValueDisplayName = options.enumOptions?.find(
    (x) => x.value === fieldValue
  )?.label;
  const uiOptions = uiSchema?.["ui:options"];

  const dependencyOptions = fieldOptionsByDependency(
    uiSchema,
    props.formContext
  );
  const required = uiSchema?.["ui:required"] || props.required;
  const fieldOptions = {
    disabled,
    required,
    ...dependencyOptions,
  };
  if (fieldOptions.hidden) {
    onChange(undefined);
    return null;
  }
  const DesktopContent = (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          disabled={fieldOptions.disabled}
          type="button"
          data-testid={props.id}
          variant="outline"
          role="combobox"
          className={cn(
            "text-muted-foreground w-full justify-between font-normal",
            fieldValue && "text-black"
          )}
        >
          {fieldValueDisplayName ||
          fieldValue ||
          uiSchema?.["ui:placeholder"] ||
          uiOptions?.["ui:placeholder"] ||
          label
            ? `Please select an ${label.toLocaleLowerCase()}`
            : "Please select"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full min-w-screen max-w-screen">
        <List {...props} setOpen={setOpen} />
      </PopoverContent>
    </Popover>
  );

  const MobileContent = (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          data-testid={props.id}
          disabled={fieldOptions.disabled}
          type="button"
          variant="outline"
          className={cn(
            "text-muted-foreground w-full justify-between font-normal",
            fieldValue && "text-black"
          )}
        >
          {fieldValue || props?.uiSchema?.["ui:placeholder"] || label
            ? `Please select an ${label.toLocaleLowerCase()}`
            : "Please select"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mt-4 border-t">
          <List {...props} setOpen={setOpen} />
        </div>
      </DrawerContent>
    </Drawer>
  );

  return isDesktop ? DesktopContent : MobileContent;
};

function List<T>({
  setOpen,
  ...props
}: WidgetProps<T> & {
  setOpen: (open: boolean) => void;
}) {
  const { uiSchema, options } = props;
  const uiOptions = uiSchema?.["ui:options"];

  return (
    <Command
      filter={(value, search) => {
        const filterResult = options.enumOptions?.find(
          (i) => i.value.toLocaleLowerCase() === value.toLocaleLowerCase()
        )?.label;
        if (
          value.includes(search) ||
          filterResult?.toLocaleLowerCase().includes(search.toLocaleLowerCase())
        )
          return 1;
        return 0;
      }}
    >
      <CommandInput
        data-testid={`${props.id}_search`}
        placeholder={(uiOptions?.searchPlaceholder as string) || "Search..."}
        className="h-9"
      />
      <CommandList className="w-full min-w-full max-w-full">
        <CommandEmpty>
          {(uiOptions?.searchResultLabel as string) || "0 search result."}
        </CommandEmpty>
        <CommandGroup>
          {options.enumOptions?.map((enumOption, index) => (
            <CommandItem
              data-testid={`${props.id}_${index}`}
              onSelect={() => {
                props.onChange(
                  uiOptions?.allowEmpty !== false
                    ? enumOption.value === props.value
                      ? undefined
                      : enumOption.value
                    : enumOption.value
                );
                setOpen(false);
              }}
              key={JSON.stringify(enumOption.value)}
              value={enumOption.value}
            >
              {enumOption.label}
              {enumOption.value === props.value && (
                <CheckIcon className={cn("ml-auto h-4 w-4")} />
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
