import { CaretSortIcon } from '@radix-ui/react-icons';
import { WidgetProps } from '@rjsf/utils';
import { CheckIcon } from 'lucide-react';
import { Dispatch, SetStateAction, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useMediaQuery } from '@/components/ui/useMediaQuery';
import { cn } from '@/lib/utils';

type CustomComboboxProps<T> = {
  emptyValue?: string;
  list: Array<T> | null | undefined;
  onValueChange?: Dispatch<SetStateAction<T | null | undefined>>;
  searchPlaceholder?: string;
  searchResultLabel?: string;
  selectIdentifier: keyof T;
  selectLabel: keyof T;
} & WidgetProps;

export function CustomCombobox<T>(props: CustomComboboxProps<T>) {
  const {
    label,
    value,
    defaultValue,
    uiSchema,
    list,
    selectIdentifier,
    selectLabel,
    disabled,
  } = props;
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [open, setOpen] = useState(false);

  const fieldValue = value || defaultValue;
  const fieldValueDisplayName = list?.find(
    (x) => x[selectIdentifier] === fieldValue
  )?.[selectLabel];
  const uiOptions = uiSchema?.['ui:options'];
  const DesktopContent = (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger
        asChild
        disabled={disabled}
        className={cn(disabled && 'cursor-not-allowed')}
      >
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className={cn(
            'text-muted-foreground w-full justify-between font-normal',
            fieldValue && 'text-black',
            disabled &&
              'disabled:pointer-events-auto hover:bg-background hover:text-muted-foreground'
          )}
        >
          <span className=" overflow-hidden text-ellipsis">
            {fieldValueDisplayName ||
              fieldValue ||
              uiSchema?.['ui:placeholder'] ||
              uiOptions?.['ui:placeholder'] ||
              uiOptions?.emptyValue ||
              `Please select an ${label.toLocaleLowerCase()}` ||
              'Please select'}
          </span>
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
          type="button"
          disabled={disabled}
          variant="outline"
          className={cn(
            'text-muted-foreground w-full justify-between font-normal',
            fieldValue && 'text-black'
          )}
        >
          {fieldValue ||
            uiSchema?.['ui:placeholder'] ||
            `Please select an ${label.toLocaleLowerCase()}` ||
            'Please select'}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
}

function List<T>({
  setOpen,
  ...props
}: CustomComboboxProps<T> & {
  setOpen: (open: boolean) => void;
}) {
  const { uiSchema, onChange, value, list, selectIdentifier, selectLabel } =
    props;
  const uiOptions = uiSchema?.['ui:options'];

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
        placeholder={(uiOptions?.searchPlaceholder as string) || 'Search...'}
        className="h-9"
      />
      <CommandList className="w-full min-w-full max-w-full">
        <CommandEmpty>
          {(uiOptions?.searchResultLabel as string) || '0 search result.'}
        </CommandEmpty>
        <CommandGroup>
          {list?.map((item: T) => (
            <CommandItem
              onSelect={() => {
                onChange(
                  uiOptions?.allowEmpty !== false
                    ? item[selectIdentifier] === value
                      ? undefined
                      : item[selectIdentifier]
                    : item[selectIdentifier]
                );
                setOpen(false);
              }}
              key={JSON.stringify(item[selectIdentifier])}
              value={item[selectIdentifier] as string}
            >
              {item[selectLabel] as string}
              {item[selectIdentifier] === value && (
                <CheckIcon className={cn('ml-auto h-4 w-4')} />
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
