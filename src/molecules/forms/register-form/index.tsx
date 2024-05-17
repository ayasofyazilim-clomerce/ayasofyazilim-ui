'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ExclamationTriangleIcon, ReloadIcon } from '@radix-ui/react-icons';

import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PasswordInput } from '../../password-input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import localeTr from '../../../locale_tr.json';
import { replacePlaceholders } from '../../../lib/replace-placeholders';

export const defaultRegisterFormSchema = z.object({
  userName: z.string().min(5),
  email: z.string().email(),
  password: z.string().min(4).max(32),
  tenantId: z.string(),
});

export type RegisterFormDataType = {
  email: string;
  password: string;
  tenantId: string;
  userName: string;
};

export type RegisterFormPropsType = {
  formSchema: z.ZodObject<any>;
  loginPath: string;
  onSubmitFunction: (values: RegisterFormDataType) => Promise<string>;
  resources?: { [key: string]: any };
};

export default function RegisterForm({
  onSubmitFunction,
  formSchema,
  loginPath,
  resources = localeTr.resources,
}: RegisterFormPropsType) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');

  const form = useForm<RegisterFormDataType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tenantId: '',
      email: '',
      password: '',
    },
  });
  function onSubmit(values: RegisterFormDataType) {
    setIsLoading(true);
    onSubmitFunction(values)
      .then(() => {
        setError('');
      })
      .catch((result) => {
        setError(result);
        setIsLoading(false);
      });
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-4 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {resources?.AbpUi?.texts?.Register}
        </h1>
        <p className="text-sm text-muted-foreground">
          {resources?.AbpIdentity?.texts?.NewUser}
        </p>
      </div>
      <div className="grid gap-4 my-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {resources?.AbpIdentity?.texts?.UserName}
                  </FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="John Doe"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {resources?.AbpIdentity?.texts?.EmailAddress}
                  </FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="name@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {resources?.AbpIdentity?.texts?.Password}
                  </FormLabel>
                  <FormControl>
                    <PasswordInput
                      disabled={isLoading}
                      placeholder={resources?.AbpIdentity?.texts?.Password}
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && (
              <Alert variant="destructive">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button variant="default" disabled={isLoading} className=" w-full ">
              {isLoading ? (
                <ReloadIcon className="mr-2 h-4 w-4  animate-spin" />
              ) : (
                resources?.AbpUi?.texts?.Register
              )}
            </Button>
          </form>
        </Form>
        <div className="flex items-center justify-center gap-4">
          <span className="w-full h-px bg-muted" />
          <span className="text-center whitespace-nowrap text-xs uppercase text-muted-foreground">
            {resources?.AbpAccount?.texts?.OrSignInWith}
          </span>
          <span className="w-full h-px bg-muted" />
        </div>
        <Button variant="outline" disabled={isLoading} className="" asChild>
          <a href={loginPath} className="text-center text-sm w-full">
            {isLoading ? (
              <ReloadIcon className="mr-2 h-4 w-4  animate-spin" />
            ) : (
              resources?.AbpUi?.texts?.Login
            )}
          </a>
        </Button>
      </div>
      <p className="px-4 text-center text-xs text-muted-foreground">
        {replacePlaceholders(
          resources?.AbpGdpr?.texts?.CookieConsentAgreePolicies,
          [
            {
              holder: '{0}',
              replacement: (
                <a
                  key="cookie-policy"
                  href="/cookies"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  {resources?.AbpGdpr?.texts?.CookiePolicy}
                </a>
              ),
            },
            {
              holder: '{1}',
              replacement: (
                <a
                  key="privacy-policy"
                  href="/privacy"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  {resources?.AbpGdpr?.texts?.PrivacyPolicy}
                </a>
              ),
            },
          ]
        )}
      </p>
    </div>
  );
}
