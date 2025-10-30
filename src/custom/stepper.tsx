'use client';

import React, {
  Children,
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useMemo,
} from 'react';
import { Button } from '@repo/ayasofyazilim-ui/components/button';
import { cn } from '@repo/ayasofyazilim-ui/lib/utils';

export interface ISeparatorProps {
  vertical?: boolean;
}
export const Separator = ({ vertical }: ISeparatorProps) => {
  const containerClass = `border-muted items-center justify-center flex ${vertical ? 'w-1' : 'h-8 w-full'
    }`;
  const innerClass = `bg-muted w-full ${vertical ? 'h-16' : 'h-1'}`;

  return (
    <div className={containerClass}>
      <div className={innerClass} />
    </div>
  );
};

export interface IStepperContentProps {
  canGoBack?: boolean;
  canGoNext?: boolean;
  children?: React.ReactNode;
  className?: string;
  controlsClassName?: string;
  isBackDisabled?: boolean;
  isNextDisabled?: boolean;
  nextButtonText?: string;
  previousButtonText?: string;
  title?: string;
}
export const StepperContent = ({
  children,
  title,
  canGoBack = true,
  canGoNext = true,
  previousButtonText,
  nextButtonText,
  isBackDisabled,
  isNextDisabled,
  className,
  controlsClassName,
}: IStepperContentProps) => {
  const {
    previousButtonText: defaultPreviousButtonText,
    nextButtonText: defaultNextButtonText,
    onIndexChange,
    vertical,
    stepsLength,
  } = useContext(StepperContext);
  const [isLastStep, setIsLastStep] = React.useState(false);
  return (
    <div id={title} className={cn(vertical ? 'w-10/12' : 'w-full', className)}>
      {children}
      {onIndexChange && (
        <div className={cn('mt-5 flex justify-between', controlsClassName)}>
          <div>
            {canGoBack && (
              <Button
                variant="outline"
                disabled={isBackDisabled}
                onClick={() =>
                  onIndexChange((prev) => {
                    if (prev > 0) {
                      return prev - 1;
                    }
                    return prev;
                  })
                }
              >
                {previousButtonText || defaultPreviousButtonText}
              </Button>
            )}
          </div>
          <div>
            {canGoNext && (
              <Button
                disabled={isNextDisabled || isLastStep}
                onClick={() =>
                  onIndexChange((prev) => {
                    if (prev === stepsLength - 1) {
                      setIsLastStep(true);
                    }
                    if (prev < stepsLength - 1) {
                      return prev + 1;
                    }
                    return prev;
                  })
                }
              >
                {nextButtonText || defaultNextButtonText}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export interface IStepperHeaderProps {
  activeItemClassName?: string;
  activeTabIndex: number;
  containerClassName?: string;
  inactiveItemClassName?: string;
  keysWithSeparator:
  | (string | { icon: React.ReactNode; index: number; title: string })[]
  | undefined;
  vertical?: boolean;
}

export const StepperHeader = ({
  keysWithSeparator,
  activeTabIndex,
  vertical,
  containerClassName,
  activeItemClassName,
  inactiveItemClassName,
}: IStepperHeaderProps) => {
  const containerClass = cn(
    `flex gap-5 justify-between relative mb-10 ${vertical ? 'flex-col items-center w-2/12' : 'w-full'
    }`,
    containerClassName
  );
  const activeItemClass = cn('bg-primary text-white', activeItemClassName);
  const inactiveItemClass = cn('bg-zinc-200 text-black', inactiveItemClassName);

  return (
    <div className={containerClass}>
      {keysWithSeparator?.map((item, index) => {
        if (typeof item === 'string') {
          return (
            <Separator
              key={`separator-${index.toString()}`}
              vertical={vertical}
            />
          );
        }

        const active = activeTabIndex === item.index;
        const innerClass = `rounded-full w-8 h-8 items-center justify-center flex text-xs ${active ? activeItemClass : inactiveItemClass
          }`;
        const titleContainerClass = `text-sm text-center ${active ? 'text-black' : 'text-muted-foreground'
          }`;
        return (
          <div key={item.index} className="flex flex-col items-center gap-2">
            <div className={innerClass}>{item.icon || item.index + 1}</div>
            <div className={titleContainerClass}>{item.title}</div>
          </div>
        );
      })}
    </div>
  );
};

const StepperContext = createContext({
  nextButtonText: 'Next',
  previousButtonText: 'Previous',
  // eslint-disable-next-line
  onIndexChange: (value: SetStateAction<number>) => { },
  vertical: false,
  stepsLength: 2,
});
export interface IStepperProps {
  activeTabIndex: number;
  children?: React.ReactNode[];
  className?: string;
  headerProps?: Partial<IStepperHeaderProps>;
  nextButtonText?: string;
  onIndexChange: Dispatch<SetStateAction<number>>;
  previousButtonText?: string;
  vertical?: boolean;
}

export default function Stepper({
  children,
  activeTabIndex,
  vertical = false,
  nextButtonText = 'Next',
  previousButtonText = 'Previous',
  onIndexChange,
  className,
  headerProps,
}: IStepperProps) {
  const keys = children?.flatMap((child, index) => {
    const item = React.isValidElement(child)
      ? { title: (child.props as { title: string }).title || '', icon: (child.props as { icon: string }).icon, index }
      : { title: '', icon: '', index };
    if (index === 0) {
      return [item];
    }
    return ['SEPARATOR', item];
  });
  const stepsLength = Children.count(children);
  const providerProps = useMemo(
    () => ({
      nextButtonText,
      previousButtonText,
      onIndexChange,
      vertical,
      stepsLength,
    }),
    [nextButtonText, previousButtonText, onIndexChange, vertical, stepsLength]
  );
  const filteredChildren = React.Children.toArray(children)?.[activeTabIndex];
  return (
    <StepperContext.Provider value={providerProps}>
      <div className={cn(vertical ? 'flex flex-row gap-10' : '', className)}>
        <StepperHeader
          keysWithSeparator={keys}
          activeTabIndex={activeTabIndex}
          vertical={vertical}
          {...headerProps}
        />
        {filteredChildren}
      </div>
    </StepperContext.Provider>
  );
}
