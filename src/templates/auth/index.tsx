'use client';

import { ReloadIcon } from '@radix-ui/react-icons';
import { cva } from 'class-variance-authority';
import React from 'react';
import { Button } from '../../../@/components/ui/button';

import { cn } from '../../../@/lib/utils';

const themeVariants = cva(
  'flex md:flex-1 justify-center items-center px-5 py-5',
  {
    variants: {
      variant: {
        ayasofyazilim: 'bg-zinc-900 text-white',
        abc1: 'bg-emerald-900 text-white',
      },
    },
    defaultVariants: {
      variant: 'ayasofyazilim',
    },
  }
);

export type AuthProps = {
  company: React.ReactNode;
  description: React.ReactNode;
  formComponent: React.ReactNode;
  isLoading: boolean;
  title: string;
  variant: 'ayasofyazilim' | 'abc1';
};

export const Auth = ({ variant, isLoading, ...props }: AuthProps) => (
  <div className="flex flex-col md:flex-row h-screen">
    <div className={cn(themeVariants({ variant }))}>
      <div className=" flex flex-row items-center">{props?.company}</div>
    </div>
    <div className="flex flex-1 container">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {props.title}
          </h1>
          <p className="text-sm text-muted-foreground">{props.description}</p>
        </div>
        <div className="grid gap-6">
          {props.formComponent}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button disabled={isLoading} variant="outline">
            {isLoading ? (
              <ReloadIcon className="mr-2 h-4 w-4  animate-spin" />
            ) : (
              <>
                <img
                  src="https://cdn.e-devlet.gov.tr/themes/izmir/images/favicons/favicon-196x196.1.8.0.png"
                  width={20}
                  className="mx-1"
                  alt="E-devlet"
                />
                <span className="mx-1">E-devlet</span>
              </>
            )}
          </Button>
        </div>{' '}
        <p className="px-8 text-center text-sm text-muted-foreground">
          By clicking continue, you agree to our{' '}
          <a
            href="/terms"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href="/privacy"
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  </div>
);
