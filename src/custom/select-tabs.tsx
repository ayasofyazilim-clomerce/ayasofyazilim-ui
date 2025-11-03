"use client";

import { Circle, CircleCheckBig } from "lucide-react";
import React, {
  createContext,
  JSX,
  useContext,
  useMemo,
  useState,
} from "react";
import { Button } from "@repo/ayasofyazilim-ui/components/button";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";

const variants = {
  default:
    "flex flex-row justify-between border-2 border-gray-300 gap-5 text-gray-700/80 flex-1",
  active:
    "flex flex-row justify-between border-2 border-primary/80  gap-5 text-primary/80 hover:text-primary  flex-1",
};

interface ISelectTabsContentProps {
  children: JSX.Element | string;
  value: string;
}
/**
 * Renders the content of a select tab.
 *
 * @param {ISelectTabsContentProps} props - The properties for the select tab content.
 * @param {string} props.value - The value of the tab.
 * @param {JSX.Element | string} props.children - The content of the tab.
 * @return {JSX.Element} The rendered select tab content.
 */
export function SelectTabsContent({
  value,
  children,
}: ISelectTabsContentProps) {
  const { activeTab, onChange } = useContext(SelectTabsContext);
  return (
    <Button
      key={value}
      className={activeTab === value ? variants.active : variants.default}
      variant="ghost"
      onClick={() => onChange(value)}
    >
      {children}
      {activeTab === value ? (
        <CircleCheckBig size={16} />
      ) : (
        <Circle size={16} />
      )}
    </Button>
  );
}
interface IContextProps {
  activeTab: string;
  onChange: (value: string) => void;
}
const SelectTabsContext = createContext<IContextProps>({
  activeTab: "",
  onChange: () => {},
});
interface ISelectTabsProps {
  children?: React.ReactNode;
  deselect?: boolean;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  value?: string;
  className?: string;
}

/**
 * Renders a set of selectable tabs.
 *
 * @param {ISelectTabsProps} props - The properties for the select tabs.
 * @param {boolean} props.deselect - Whether the tabs can have a null value.
 * @param {React.ReactNode} props.children - The content of the tabs.
 * @param {string } [props.value] - The initial active tab value.
 * @param {(newValue: string) => void} [props.onValueChange] - The callback function triggered when the active tab value changes.
 * @param {boolean} [props.disabled] - Whether the tabs are disabled.
 * @return {JSX.Element} The rendered select tabs.
 */
export default function SelectTabs({
  deselect,
  children,
  value = "",
  onValueChange,
  disabled,
  className,
}: ISelectTabsProps) {
  const [activeTab, setActiveTab] = useState(value);
  const contextValue = useMemo(() => ({ activeTab, onChange }), [activeTab]);
  function onChange(newValue: string) {
    if (disabled) return;

    if (newValue === activeTab && deselect) {
      setActiveTab("");
      onValueChange?.("");
    } else if (newValue !== activeTab) {
      setActiveTab(newValue);
      onValueChange?.(newValue);
    }
  }

  return (
    <SelectTabsContext.Provider value={contextValue}>
      <div className={cn("w-full grid gap-3", className)}>{children}</div>
    </SelectTabsContext.Provider>
  );
}
