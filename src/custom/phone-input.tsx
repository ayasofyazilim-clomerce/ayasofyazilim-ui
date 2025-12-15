"use client";

import { ChevronDownIcon, PhoneIcon } from "lucide-react";
import React, { useMemo, useState } from "react";
import PhoneInputWithCountrySelect, {
  Country,
  FlagProps,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumber,
} from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

import { Input } from "@repo/ayasofyazilim-ui/components/input";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
// import { FieldErrorTemplate } from "./schema-form/fields";

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
  defaultCountry,
}: {
  id: string;
  name?: string;
  placeholder?: string;
  defaultValue?: string | undefined;
  value?: string;
  onChange?: (values: {
    value: string | undefined;
    parsed: ReturnType<typeof parsePhoneNumber>;
  }) => void;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  defaultCountry: string;
}) {
  const [value, setValue] = useState(initialValue || defaultValue || "");
  const [isPhoneValid, setIsPhoneValid] = useState(true);
  return (
    <>
      <PhoneInputWithCountrySelect
        className={cn("flex rounded-md shadow-xs", className)}
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
          setIsPhoneValid(isValidPhoneNumber(newValue || ""));
        }}
      />
      {/* {!isPhoneValid && (
        <FieldErrorTemplate errors={["Please enter a valid phone number."]} />
      )} */}
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
    data-slot="phone-input"
    className={cn(
      "-ms-px rounded-s-none shadow-none focus-visible:z-10",
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
  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!onChange) return;
    onChange(event.target.value as Country);
  };
  return (
    <div className="border-input bg-background text-muted-foreground focus-within:border-ring focus-within:ring-ring/50 hover:bg-accent hover:text-foreground has-aria-invalid:border-destructive/60 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 relative inline-flex items-center self-stretch rounded-s-md border py-2 ps-3 pe-2 transition-[color,box-shadow] outline-none focus-within:z-10 focus-within:ring-[3px] has-disabled:pointer-events-none has-disabled:opacity-50">
      <div className="inline-flex items-center gap-1" aria-hidden="true">
        <FlagComponent country={value} countryName={value} aria-hidden="true" />
        <span className="text-muted-foreground/80">
          <ChevronDownIcon size={16} aria-hidden="true" />
        </span>
      </div>
      <select
        disabled={disabled}
        value={value}
        id={`${id}_select`}
        data-testid={`${id}_select`}
        onChange={handleSelect}
        className="absolute inset-0 text-sm opacity-0"
        aria-label="Select country"
      >
        <option key="default" value="" data-testid={`${id}_default`}>
          Select a country
        </option>
        {options
          .filter((x) => x.value)
          .map((option, i) => (
            <option
              key={option.value ?? `empty-${i}`}
              value={option.value}
              data-testid={`${id}_${option.value}`}
            >
              {option.label}{" "}
              {option.value && `+${getCountryCallingCode(option.value)}`}
            </option>
          ))}
      </select>
    </div>
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
