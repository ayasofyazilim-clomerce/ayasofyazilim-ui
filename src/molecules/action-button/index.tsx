import { Button, ButtonProps } from '@repo/ayasofyazilim-ui/atoms/button';
import React, { ComponentType } from 'react';
import { cn } from '@/lib/utils';

export function ActionList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'justify-end gap-2 rounded-md border p-2 has-[*]:flex hidden',
        className
      )}
    >
      {children}
    </div>
  );
}

export function ActionButton({
  loading,
  onClick,
  text,
  icon: Icon,
  variant = 'outline',
}: {
  loading: boolean;
  onClick?: () => void;
  text: string;
  icon: ComponentType<{ className?: string }>;
  variant?: ButtonProps['variant'];
}) {
  return (
    <Button disabled={loading} onClick={onClick} variant={variant}>
      <Icon className="mr-2 size-4" />
      <span className="sr-only">{text}</span>
      <span className="sm:hidden md:block">{text}</span>
    </Button>
  );
}
