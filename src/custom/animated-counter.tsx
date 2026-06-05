"use client";

import * as React from "react";

import { MotionValue, motion, useSpring, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

const cn = (...args: any[]) => {
  return twMerge(clsx(args));
};

const fontSize = 40;
const padding = 10;
const height = fontSize + padding;

interface AnimatedCounterProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLParagraphElement>,
    HTMLParagraphElement
  > {
  start?: number;
  end?: number;
  duration?: number;
  className?: string;
  fontSize?: number;
  /** Controlled mode — when provided the internal counter is bypassed */
  value?: number;
  /** Minimum digits to render (enables leading zeros) */
  minDigits?: number;
}

export const AnimatedCounter = ({
  start = 0,
  end = 0,
  duration,
  className,
  fontSize = 30,
  value: controlledValue,
  minDigits = 1,
  ...rest
}: AnimatedCounterProps) => {
  const [internalValue, setInternalValue] = useState(start);
  const displayValue =
    controlledValue !== undefined ? controlledValue : internalValue;

  useEffect(() => {
    if (controlledValue !== undefined) return;
    const range = Math.max(end - start, 1);
    const interval = setInterval(
      () => {
        if (internalValue < end) {
          setInternalValue((prev) => prev + 1);
        }
      },
      ((duration ?? end) / range) * 1000
    );

    return () => clearInterval(interval);
  }, [internalValue, controlledValue, duration, end, start]);

  return (
    <div
      style={{ fontSize }}
      {...rest}
      className={cn(
        "flex overflow-hidden rounded px-2 leading-none font-bold ",
        className
      )}
    >
      {(displayValue >= 100000 || minDigits >= 6) && (
        <Digit place={100000} value={displayValue} />
      )}
      {(displayValue >= 10000 || minDigits >= 5) && (
        <Digit place={10000} value={displayValue} />
      )}
      {(displayValue >= 1000 || minDigits >= 4) && (
        <Digit place={1000} value={displayValue} />
      )}
      {(displayValue >= 100 || minDigits >= 3) && (
        <Digit place={100} value={displayValue} />
      )}
      {(displayValue >= 10 || minDigits >= 2) && (
        <Digit place={10} value={displayValue} />
      )}
      <Digit place={1} value={displayValue} />
    </div>
  );
};

function Digit({ place, value }: { place: number; value: number }) {
  const valueRoundedToPlace = Math.floor(value / place);
  const animatedValue = useSpring(valueRoundedToPlace);

  useEffect(() => {
    animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace]);

  return (
    <div style={{ height }} className="relative w-[1ch] tabular-nums">
      {[...Array(10)].map((_, i) => (
        <Number key={i} mv={animatedValue} number={i} />
      ))}
    </div>
  );
}

function Number({ mv, number }: { mv: MotionValue; number: number }) {
  const y = useTransform(mv, (latest) => {
    const placeValue = latest % 10;
    const offset = (10 + number - placeValue) % 10;

    let memo = offset * height;

    if (offset > 5) {
      memo -= 10 * height;
    }

    return memo;
  });

  return (
    <motion.span
      style={{ y }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {number}
    </motion.span>
  );
}
