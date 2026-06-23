import { WidgetProps } from "@rjsf/utils";
import { useEffect, useRef, useState } from "react";
import AsyncSelect, {
  BadgeConfig,
  SearchItem,
} from "@repo/ayasofyazilim-ui/custom/async-select";
import {
  Combobox,
  ComboboxProps,
} from "@repo/ayasofyazilim-ui/custom/combobox";

export function CustomComboboxWidget<T>({
  languageData,
  selectLabel,
  selectIdentifier,
  list,
  onChange,
  disabledItems,
  badges,
  link,
  customItemRenderer,
}: {
  languageData: {
    "Select.Placeholder": string;
    "Select.ResultLabel": string;
    "Select.EmptyValue": string;
  };
  selectIdentifier: keyof T;
  selectLabel: keyof T;
  list: T[];
  onChange?: (value: T | null | undefined) => void;
  disabledItems?: ComboboxProps<T>["disabledItems"];
  badges?: ComboboxProps<T>["badges"];
  link?: ComboboxProps<T>["link"];
  customItemRenderer?: ComboboxProps<T>["customItemRenderer"];
}) {
  function Widget(props: WidgetProps) {
    const { uiSchema } = props;
    const uiList = (uiSchema?.["ui:optionList"] as T[] | undefined) ?? list;
    const allowEmpty = uiSchema?.["ui:options"]?.allowEmpty !== false;
    const currentValue = props.value ?? props.defaultValue;
    const selectedItem =
      uiList.find((item) => item[selectIdentifier] === currentValue) ?? null;
    return (
      <Combobox<T>
        id={props.id}
        disabled={props.disabled}
        list={uiList}
        value={selectedItem}
        selectIdentifier={selectIdentifier}
        selectLabel={selectLabel}
        searchPlaceholder={languageData["Select.Placeholder"]}
        searchResultLabel={languageData["Select.ResultLabel"]}
        emptyValue={languageData["Select.EmptyValue"]}
        classNames={{ trigger: { button: "shadow-xs hover:bg-white" } }}
        disabledItems={disabledItems}
        badges={badges}
        link={link}
        customItemRenderer={customItemRenderer}
        onValueChange={(item) => {
          const clickedId = item?.[selectIdentifier];
          const newValue =
            allowEmpty && clickedId === currentValue ? undefined : clickedId;
          props.onChange(newValue);
          onChange?.(
            newValue === undefined
              ? null
              : uiList.find((i) => i[selectIdentifier] === newValue) ?? null
          );
        }}
      />
    );
  }
  return Widget;
}

export function AsyncComboboxWidget<T extends SearchItem>({
  languageData,
  selectIdentifier,
  selectLabel,
  fetchAction,
  onChange,
  badges,
  multiple = false,
}: {
  languageData: {
    "Select.Placeholder": string;
    "Select.ResultLabel": string;
    "Select.EmptyValue": string;
  };
  selectIdentifier: keyof T & string;
  selectLabel: keyof T & string;
  fetchAction: (search: string) => Promise<T[]>;
  onChange?: (value: T | T[] | null | undefined) => void;
  badges?: BadgeConfig<T>[];
  multiple?: boolean;
}) {
  function Widget(props: WidgetProps) {
    const [selectedItems, setSelectedItems] = useState<T[]>([]);
    const selectedItemsRef = useRef<T[]>(selectedItems);
    selectedItemsRef.current = selectedItems;

    useEffect(() => {
      if (!props.value) {
        setSelectedItems([]);
        return;
      }
      const ids: unknown[] = Array.isArray(props.value)
        ? props.value
        : [props.value];
      if (ids.length === 0) {
        setSelectedItems([]);
        return;
      }
      const current = selectedItemsRef.current;
      const alreadyResolved = ids.every((id) =>
        current.some((item) => String(item[selectIdentifier]) === String(id))
      );
      if (alreadyResolved && current.length === ids.length) return;
      fetchAction("").then((results) => {
        const matched = ids
          .map((id) =>
            results.find((r) => String(r[selectIdentifier]) === String(id))
          )
          .filter(Boolean) as T[];
        setSelectedItems(matched);
      });
    }, [props.value]);

    return (
      <AsyncSelect<T>
        id={props.id}
        fetchAction={fetchAction}
        value={selectedItems}
        onChange={(items) => {
          setSelectedItems(items);
          if (multiple) {
            const newValue = items.map((item) => item[selectIdentifier]);
            props.onChange(newValue);
            if (onChange) {
              onChange(items);
            }
          } else {
            const item = items[0];
            const newValue = item ? item[selectIdentifier] : undefined;
            props.onChange(newValue);
            if (onChange) {
              onChange(item ?? null);
            }
          }
        }}
        disabled={props.disabled}
        multiple={multiple}
        closeOnSelect={!multiple}
        identifierKey={selectIdentifier}
        labelKey={selectLabel}
        searchText={languageData["Select.Placeholder"]}
        resultText={languageData["Select.ResultLabel"]}
        noResultText={languageData["Select.EmptyValue"]}
        badges={badges}
      />
    );
  }
  return Widget;
}
