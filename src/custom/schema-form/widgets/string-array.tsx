import { ButtonProps } from "@repo/ayasofyazilim-ui/components/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@repo/ayasofyazilim-ui/components/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ayasofyazilim-ui/components/tooltip";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { WidgetProps } from "@rjsf/utils";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useCallback, useState } from "react";

interface StringArrayWidgetConfig {
  classNames?: {
    container?: string;
    listContainer?: string;
    listItem?: string;
    listItemText?: string;
    removeButton?: string;
    inputContainer?: string;
    input?: string;
    addButton?: string;
  };
  icons?: {
    add?: React.ComponentType<{ className?: string }>;
    remove?: React.ComponentType<{ className?: string }>;
  };
  iconSizes?: {
    add?: string;
    remove?: string;
  };
  buttonVariants?: {
    add?: ButtonProps["variant"];
    remove?: ButtonProps["variant"];
  };
  buttonSizes?: {
    add?: "icon-xs" | "sm" | "icon-sm" | "xs";
    remove?: "icon-xs" | "sm" | "icon-sm" | "xs";
  };
  maxItems?: number;
  maxHeight?: string;
  allowDuplicates?: boolean;
  trimValues?: boolean;
  validateValue?: (value: string) => boolean | string;
  transformValue?: (value: string) => string;
  renderItem?: (
    value: string,
    index: number,
    onRemove: () => void
  ) => React.ReactNode;
  emptyState?: React.ReactNode;
  placeholder?: string;
  addButtonLabel?: string;
  removeButtonLabel?: string;
  errorMessages?: {
    duplicate?: string;
    invalid?: string;
    maxItems?: (max: number) => string;
  };
  messages?: {
    maxReached?: (max: number) => string;
  };
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  onAdd?: (value: string) => void;
  onRemove?: (value: string, index: number) => void;
  disabled?: boolean;
}

export function CustomStringArrayWidget(config: StringArrayWidgetConfig = {}) {
  const {
    classNames = {},
    icons = {},
    iconSizes = { add: "icon-xs", remove: "icon-xs" },
    buttonVariants = { add: "default", remove: "secondary" },
    buttonSizes = { add: "icon-xs", remove: undefined },
    maxItems,
    maxHeight = "max-h-52",
    allowDuplicates = false,
    trimValues = true,
    validateValue,
    transformValue,
    renderItem,
    emptyState,
    placeholder,
    addButtonLabel,
    removeButtonLabel,
    errorMessages = {},
    messages = {},
    inputProps = {},
    onAdd,
    onRemove,
    disabled = false,
  } = config;

  const AddIcon = icons.add || PlusIcon;
  const RemoveIcon = icons.remove || Trash2Icon;

  const Widget = (props: WidgetProps) => {
    const [inputValue, setInputValue] = useState("");
    const [error, setError] = useState<string>("");

    const currentValues = props.value || [];

    const handleValue = useCallback(
      (value: string) => {
        const processedValue = trimValues ? value.trim() : value;

        if (!processedValue) {
          return;
        }
        const finalValue = transformValue
          ? transformValue(processedValue)
          : processedValue;
        if (!allowDuplicates && currentValues.includes(finalValue)) {
          if (errorMessages.duplicate) {
            setError(errorMessages.duplicate);
          }
          return;
        }
        if (validateValue) {
          const validationResult = validateValue(finalValue);
          if (validationResult === false) {
            if (errorMessages.invalid) {
              setError(errorMessages.invalid);
            }
            return;
          }
          if (typeof validationResult === "string") {
            setError(validationResult);
            return;
          }
        }
        if (maxItems && currentValues.length >= maxItems) {
          if (errorMessages.maxItems) {
            setError(errorMessages.maxItems(maxItems));
          }
          return;
        }
        setError("");
        props.onChange([...currentValues, finalValue]);
        setInputValue("");
        if (onAdd) {
          onAdd(finalValue);
        }
      },
      [currentValues, props]
    );

    const handleRemove = useCallback(
      (index: number) => {
        const valueToRemove = currentValues[index];
        const newValues = currentValues.filter(
          (_: string, i: number) => i !== index
        );
        props.onChange(newValues);
        if (onRemove) {
          onRemove(valueToRemove, index);
        }
      },
      [currentValues, props, onRemove]
    );

    const isDisabled = disabled || props.disabled;
    const isMaxReached = !!(maxItems && currentValues.length >= maxItems);

    return (
      <InputGroup
        className={cn(
          "p-1.5",
          currentValues.length === 0 && "p-0",
          classNames.container
        )}
      >
        <InputGroupAddon
          align="block-end"
          className={cn(
            "flex-col gap-1.5",
            maxHeight,
            "overflow-auto p-0",
            classNames.listContainer || ""
          )}
        >
          {currentValues.length === 0 && emptyState
            ? emptyState
            : currentValues.map((value: string, index: number) => {
                if (renderItem) {
                  return renderItem(value, index, () => handleRemove(index));
                }

                return (
                  <InputGroupText
                    className={cn(
                      "bg-accent relative w-full overflow-hidden pl-2 pr-1 min-h-8 h-8 rounded-md",
                      classNames.listItem || ""
                    )}
                    key={`${value}-${index}`}
                  >
                    <span
                      className={cn(
                        "truncate text-ellipsis",
                        classNames.listItemText || ""
                      )}
                    >
                      {value}
                    </span>
                    <InputGroupButton
                      className={cn(
                        "rounded-md ml-auto",
                        classNames.removeButton || ""
                      )}
                      variant={buttonVariants.remove}
                      size={buttonSizes.remove}
                      onClick={() => handleRemove(index)}
                      disabled={isDisabled}
                      aria-label={removeButtonLabel}
                    >
                      <RemoveIcon className={iconSizes.remove} />
                    </InputGroupButton>
                  </InputGroupText>
                );
              })}
        </InputGroupAddon>
        <InputGroupAddon
          align="block-end"
          className={cn(
            "p-0 justify-between",
            currentValues.length === 0 && "pr-1.5 ",
            classNames.inputContainer || ""
          )}
        >
          <Tooltip open={!!error}>
            <TooltipTrigger asChild>
              <div>
                <InputGroupInput
                  className={cn(
                    "pl-2",
                    error && "text-destructive",
                    classNames.input || ""
                  )}
                  placeholder={placeholder || props.options.placeholder}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleValue(inputValue);
                    }
                  }}
                  {...inputProps}
                />
              </div>
            </TooltipTrigger>
            {error && <TooltipContent>{error}</TooltipContent>}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <InputGroupButton
                  type="button"
                  variant={buttonVariants.add}
                  className={cn(
                    "rounded-md ml-auto",
                    classNames.addButton || ""
                  )}
                  size={buttonSizes.add}
                  onClick={() => handleValue(inputValue)}
                  disabled={isDisabled || isMaxReached || !inputValue}
                  aria-label={addButtonLabel}
                >
                  <AddIcon className={iconSizes.add} />
                  <span className="sr-only">{addButtonLabel}</span>
                </InputGroupButton>
              </div>
            </TooltipTrigger>
            {isMaxReached && messages.maxReached && (
              <TooltipContent side="bottom">
                {messages.maxReached(maxItems!)}
              </TooltipContent>
            )}
          </Tooltip>
        </InputGroupAddon>
      </InputGroup>
    );
  };

  return Widget;
}
