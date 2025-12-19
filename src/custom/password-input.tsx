"use client";

import { InputProps } from "@repo/ayasofyazilim-ui/components/input";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { EyeIcon, EyeOffIcon, RotateCcwKey } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../components/input-group";

interface PasswordInputProps extends InputProps {
  passwordLength?: number;
  showGenerator?: boolean;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    { className, showGenerator = false, passwordLength = 10, ...props },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const internalRef = useRef<HTMLInputElement>(null);
    const { disabled } = props;

    useImperativeHandle(ref, () => internalRef.current!, []);

    // Memoize character sets to avoid recreation on every render
    const characterSets = useMemo(() => {
      const sets = {
        lowercase: "abcdefghijklmnopqrstuvwxyz",
        uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        numbers: "0123456789",
        symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
      };

      return {
        ...sets,
        all: sets.lowercase + sets.uppercase + sets.numbers + sets.symbols,
      };
    }, []);
    // Memoize class names to prevent unnecessary re-renders
    const inputClassName = useMemo(
      () =>
        cn(
          "hide-password-toggle",
          showGenerator ? "pr-20" : "pr-10",
          className
        ),
      [showGenerator, className]
    );

    // Use crypto.getRandomValues for better randomness when available
    const getRandomInt = useCallback((max: number): number => {
      if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        return (array[0] ?? 0) % max;
      }
      return Math.floor(Math.random() * max);
    }, []);

    // Fisher-Yates shuffle algorithm for better randomization
    const shuffleArray = useCallback(
      (array: string[]): string[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = getRandomInt(i + 1);
          const elemI = shuffled[i];
          const elemJ = shuffled[j];
          if (elemI !== undefined && elemJ !== undefined) {
            [shuffled[i], shuffled[j]] = [elemJ, elemI];
          }
        }
        return shuffled;
      },
      [getRandomInt]
    );

    const generatePassword = useCallback(
      (length: number = passwordLength): string => {
        const { lowercase, uppercase, numbers, symbols, all } = characterSets;

        // Ensure minimum requirements
        const requiredChars = [
          lowercase[getRandomInt(lowercase.length)],
          uppercase[getRandomInt(uppercase.length)],
          numbers[getRandomInt(numbers.length)],
          symbols[getRandomInt(symbols.length)],
        ];

        // Fill remaining positions
        const remainingLength = Math.max(0, length - requiredChars.length);
        const additionalChars = Array.from(
          { length: remainingLength },
          () => all[getRandomInt(all.length)]
        );

        // Combine and shuffle
        const allChars = [...requiredChars, ...additionalChars] as string[];
        return shuffleArray(allChars).join("");
      },
      [passwordLength, characterSets, getRandomInt, shuffleArray]
    );

    // Optimized event dispatching
    const dispatchInputEvents = useCallback(
      (input: HTMLInputElement, value: string) => {
        const _input = input;
        // Use React's internal event system when possible
        const descriptor = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value"
        );
        if (descriptor?.set) {
          descriptor.set.call(_input, value);
        } else {
          _input.value = value;
        }

        // Dispatch events in the correct order
        const inputEvent = new Event("input", { bubbles: true });
        const changeEvent = new Event("change", { bubbles: true });

        _input.dispatchEvent(inputEvent);
        _input.dispatchEvent(changeEvent);
      },
      []
    );

    const handleGeneratePassword = useCallback(() => {
      if (disabled || !internalRef.current) return;

      const newPassword = generatePassword(passwordLength);
      dispatchInputEvents(internalRef.current, newPassword);
    }, [disabled, generatePassword, passwordLength, dispatchInputEvents]);

    const togglePasswordVisibility = useCallback(() => {
      setShowPassword((prev) => !prev);
    }, []);

    return (
      <InputGroup>
        <InputGroupInput
          placeholder={props.placeholder}
          className={inputClassName}
          ref={internalRef}
          {...props}
          type={showPassword ? "text" : "password"}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            variant="ghost"
            aria-label={showPassword ? "Hide password" : "Show password"}
            size="icon-xs"
            onClick={togglePasswordVisibility}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </InputGroupButton>
        </InputGroupAddon>
        {showGenerator && (
          <InputGroupAddon align="inline-start">
            <InputGroupButton
              variant="ghost"
              size="icon-xs"
              onClick={handleGeneratePassword}
            >
              <RotateCcwKey />
              <span className="sr-only">Generate password</span>
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
export type { PasswordInputProps };
