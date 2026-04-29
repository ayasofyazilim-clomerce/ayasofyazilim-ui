"use client";

import { PhoneIcon } from "lucide-react";
import React, { useState } from "react";
import PhoneInputWithCountrySelect, {
  Country,
  FlagProps,
  getCountryCallingCode,
  parsePhoneNumber,
} from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

import { Input } from "@repo/ayasofyazilim-ui/components/input";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../components/select";
// import { FieldErrorTemplate } from "./schema-form/fields";
export type PhoneInputValues = {
  value: string | undefined;
  parsed: ReturnType<typeof parsePhoneNumber>;
};
export type PhoneInputProps = {
  id: string;
  name?: string;
  placeholder?: string;
  defaultValue?: string | undefined;
  value?: string;
  onChange?: (values: PhoneInputValues) => void;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  defaultCountry?: string;
};
export function PhoneInput({
  id,
  name,
  placeholder,
  defaultValue,
  value: initialValue,
  onChange,
  disabled,
  required,
  className,
  defaultCountry = "US",
}: PhoneInputProps) {
  const [value, setValue] = useState(initialValue || defaultValue || "");
  return (
    <>
      <PhoneInputWithCountrySelect
        className={cn("flex rounded-r-md shadow-xs", className)}
        international
        flagComponent={FlagComponent}
        defaultCountry={defaultCountry as Country}
        countrySelectComponent={(props) => CountrySelect({ ...props, id })}
        inputComponent={_PhoneInput}
        id={id}
        required={required}
        data-testid={id}
        disabled={disabled}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={(newValue) => {
          setValue(newValue ?? "");
          if (onChange) {
            onChange({
              value: newValue ?? undefined,
              parsed: parsePhoneNumber(newValue || ""),
            });
          }
        }}
      />
    </>
  );
}

// Use forwardRef to support refs from react-phone-number-input
const _PhoneInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <Input
    data-testid={`${props.id}_input`}
    data-slot="input-group-control"
    className={cn(
      "-ms-px rounded-s-none rounded-l-none! shadow-none focus-visible:z-10",
      className
    )}
    ref={ref}
    {...props}
  />
));

_PhoneInput.displayName = "_PhoneInput";

type CountrySelectProps = {
  id: string;
  disabled?: boolean;
  value: Country;
  onChange?: (value: Country) => void;
  options: { label: string; value: Country | undefined }[];
};

const CountrySelect = ({
  id,
  disabled,
  value,
  onChange,
  options,
}: CountrySelectProps) => {
  const handleSelect = (value: Country) => {
    if (!onChange) return;
    onChange(value);
  };
  return (
    <Select
      disabled={disabled}
      value={value}
      data-testid={`${id}_select`}
      onValueChange={handleSelect}
      aria-label="Select country"
    >
      <SelectTrigger className="border-r-0 rounded-r-none shadow-none">
        <FlagComponent country={value} countryName={value} aria-hidden="true" />
      </SelectTrigger>
      <SelectContent>
        {options
          .filter((x) => x.value)
          .map((option, i) => {
            if (!option.value) return null;
            return (
              <SelectItem
                key={option.value + i}
                value={option.value}
                data-testid={`${id}_${option.value}`}
              >
                {option.label}
                {option.value && `+${getCountryCallingCode(option.value)}`}
              </SelectItem>
            );
          })}
      </SelectContent>
    </Select>
  );
};

const FlagComponent = ({ country, countryName }: FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="w-5 overflow-hidden rounded-sm">
      {Flag ? (
        <Flag title={countryName} />
      ) : (
        <PhoneIcon size={16} aria-hidden="true" />
      )}
    </span>
  );
};
