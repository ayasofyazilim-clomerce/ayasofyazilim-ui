'use client';

import React, { useRef } from 'react';

import { ExclamationTriangleIcon, ReloadIcon } from '@radix-ui/react-icons';

import { Button } from '../../../@/components/ui/button';
import { Auth } from '../../templates/auth';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../../@/components/ui/alert';
import { Input } from '../../../@/components/ui/input';
import { Label } from '../../../@/components/ui/label';

export type LoginProps = {
  company: React.ReactNode;
  onSubmitFunction: (email: string) => Promise<string>;
  variant: 'ayasofyazilim' | 'abc1';
};
export const Login = ({ variant, onSubmitFunction, company }: LoginProps) => {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();

    if (!emailRef.current?.value || !passwordRef.current?.value) return;
    setIsLoading(true);

    onSubmitFunction(emailRef.current.value)
      .then(() => {
        setError('');
        window.location.reload();
      })
      .catch((result) => {
        setError(result);
        setIsLoading(false);
      });
  }

  const formComponent = (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4">
        <div className="grid gap-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            placeholder="name@example.com"
            type="email"
            autoComplete="email"
            ref={emailRef}
            autoFocus
          />
        </div>

        <div className="grid gap-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            placeholder="password"
            type="password"
            autoComplete="no"
            ref={passwordRef}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button disabled={isLoading}>
          {isLoading ? (
            <ReloadIcon className="mr-2 h-4 w-4  animate-spin" />
          ) : (
            'Log in with Email'
          )}
        </Button>
      </div>
    </form>
  );
  return (
    <Auth
      company={company}
      variant={variant}
      formComponent={formComponent}
      isLoading={isLoading}
      title="Log in"
      description={
        <a href="/register" className="text-slate-500 text-center text-sm">
          Don&apos;t you have an account?
        </a>
      }
    />
  );
};
