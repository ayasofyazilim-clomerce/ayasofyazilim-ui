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
import { Badge } from '@/components/ui/badge';
import { fieldOptionsByDependency } from '../utils/dependency';

type BadgeOptions = { className?: string; showValue?: boolean; label?: string };

type CustomComboboxProps<T> = {
  emptyValue?: string;
  list: Array<T> | null | undefined;
  onValueChange?: Dispatch<SetStateAction<T | null | undefined>>;
  searchPlaceholder?: string;
  searchResultLabel?: string;
  selectIdentifier: keyof T;
  selectLabel: keyof T;
  disabledItems?: T[keyof T][];
  badges?: Partial<Record<keyof T, BadgeOptions>>;
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
    emptyValue,
    required,
  } = props;
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [open, setOpen] = useState(false);
  const fieldValue = value || defaultValue;
  const fieldValueDisplayName = list?.find(
    (x) => x[selectIdentifier] === fieldValue
  )?.[selectLabel];
  const uiOptions = uiSchema?.['ui:options'];
  const dependencyOptions = fieldOptionsByDependency(
    uiSchema,
    props.formContext
  );
  const fieldOptions = {
    disabled,
    required,
    ...dependencyOptions,
  };
  if (fieldOptions.hidden) return null;
  const DesktopContent = (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger
        asChild
        disabled={fieldOptions.disabled}
        className={cn(disabled && 'cursor-not-allowed')}
      >
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className={cn(
            'text-muted-foreground w-full justify-between font-normal',
            fieldValueDisplayName && 'text-black',
            disabled &&
              'disabled:pointer-events-auto hover:bg-background hover:text-muted-foreground'
          )}
        >
          <span className=" overflow-hidden text-ellipsis has-[role=dialog]:max-w-xs">
            {fieldValueDisplayName
              ? fieldValueDisplayName.toString()
              : emptyValue ||
                  uiSchema?.['ui:placeholder']?.toString() ||
                  uiOptions?.['ui:placeholder']?.toString() ||
                  label
                ? `Please select an ${label.toLocaleLowerCase()}`
                : 'Please select'}
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
          disabled={fieldOptions.disabled}
          variant="outline"
          className={cn(
            'text-muted-foreground w-full justify-between font-normal',
            fieldValueDisplayName && 'text-black'
          )}
        >
          {fieldValueDisplayName
            ? fieldValueDisplayName.toString()
            : emptyValue ||
                uiSchema?.['ui:placeholder']?.toString() ||
                uiOptions?.['ui:placeholder']?.toString() ||
                label
              ? `Please select an ${label.toLocaleLowerCase()}`
              : 'Please select'}
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
  const {
    uiSchema,
    onChange,
    value,
    list,
    selectIdentifier,
    selectLabel,
    searchPlaceholder,
    searchResultLabel,
    onValueChange,
    badges,
  } = props;
  const uiOptions = uiSchema?.['ui:options'];

  return (
    <Command
      filter={(value, search) => {
        const filterResult = list?.find(
          (i) =>
            (i[selectIdentifier] as string).toString()?.toLocaleLowerCase() ===
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
        placeholder={searchPlaceholder || 'Search...'}
        className="h-9"
      />
      <CommandList className="w-full min-w-full max-w-full">
        <CommandEmpty>{searchResultLabel || '0 search result.'}</CommandEmpty>
        <CommandGroup>
          {list?.map((item: T) => (
            <CommandItem
              disabled={props.disabledItems?.includes(item[selectIdentifier])}
              onSelect={() => {
                onChange(
                  uiOptions?.allowEmpty !== false
                    ? item[selectIdentifier] === value
                      ? undefined
                      : item[selectIdentifier]
                    : item[selectIdentifier]
                );
                if (onValueChange)
                  onValueChange(
                    list.find((i) => i[selectIdentifier] === value)
                  );
                setOpen(false);
              }}
              key={JSON.stringify(item[selectIdentifier])}
              value={item[selectIdentifier] as string}
            >
              {item[selectIdentifier] === value && (
                <CheckIcon className={cn('mr-2 h-4 w-4')} />
              )}
              {item[selectLabel] as string}
              {badges && (
                <div className="ml-auto">
                  {Object.keys(badges).map((badgeKey) => {
                    const badgeOptions = badges[badgeKey as keyof T];
                    if (!badgeOptions) return null;
                    return (
                      <Badge
                        key={badgeKey}
                        variant="outline"
                        className={cn('ml-2', badgeOptions.className)}
                      >
                        {badgeOptions.showValue !== false &&
                          (item[badgeKey as keyof T] as string)}
                        {badgeOptions.label && badgeOptions.label}
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

export function CustomComboboxWidget<T>({
  languageData,
  selectLabel,
  selectIdentifier,
  list,
  disabledItems,
  badges,
}: {
  languageData: {
    'Select.Placeholder': string;
    'Select.ResultLabel': string;
    'Select.EmptyValue': string;
  };
  selectIdentifier: keyof T;
  selectLabel: keyof T;
  list: T[];
  disabledItems?: T[keyof T][];
  badges?: CustomComboboxProps<T>['badges'];
}) {
  function Widget(props: WidgetProps) {
    return (
      <CustomCombobox<T>
        {...props}
        list={list}
        searchPlaceholder={languageData['Select.Placeholder']}
        searchResultLabel={languageData['Select.ResultLabel']}
        emptyValue={languageData['Select.EmptyValue']}
        selectIdentifier={selectIdentifier}
        selectLabel={selectLabel}
        disabledItems={disabledItems}
        badges={badges}
      />
    );
  }
  return Widget;
}
