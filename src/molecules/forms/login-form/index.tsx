'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ExclamationTriangleIcon, ReloadIcon } from '@radix-ui/react-icons';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import localeTr from '../../../locale_tr.json';
import { replacePlaceholders } from '../../../lib';
import ForgotPasswordForm, {
  ForgotPasswordFormDataType,
  defaultForgotPasswordFormSchema,
} from '../forgot-password-form';

// export const onSubmitFunctionToTest = (
//   values: LoginFormDataType
// ): Promise<string> => {
//   return new Promise(async (resolve, reject) => {
//     const result = await new Promise(() => 'Success'); //await handler(values);
//     console.log(values);
//     if (result !== 'Success') {
//       return reject(result);
//     }
//     return resolve(result);
//     //router.push("/profile");
//   });
// };

export const defaultLoginFormSchema = z.object({
  userIdentifier: z.string().min(5),
  password: z.string().min(4).max(32),
  tenantId: z.string(),
});

export type LoginFormDataType = {
  password: string;
  tenantId: string;
  userIdentifier: string;
};

export type LoginPropsType = {
  allowTenantChange: boolean;
  formSchema: z.ZodObject<any>;
  onForgotPasswordSubmit?: (
    values: ForgotPasswordFormDataType
  ) => Promise<string>;
  onSubmitFunction: (values: LoginFormDataType) => Promise<string>;
  registerPath: string;
  resources?: { [key: string]: any };
};

export default function LoginForm({
  onSubmitFunction,
  formSchema,
  allowTenantChange,
  registerPath,
  resources = localeTr.resources,
  onForgotPasswordSubmit,
}: LoginPropsType) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');

  const form = useForm<LoginFormDataType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tenantId: '',
      userIdentifier: '',
      password: '',
    },
  });

  function onSubmit(values: LoginFormDataType) {
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
    <div className="mx-auto flex w-full flex-col justify-center gap-4 sm:w-[350px] p-5">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {resources?.AbpUi?.texts?.Login}
        </h1>
      </div>
      <div className="space-y-4 grid">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            id="login-form"
          >
            {allowTenantChange && (
              <FormField
                control={form.control}
                name="tenantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {resources?.AbpIdentity?.texts?.Tenant}
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="Tenant"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="userIdentifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {resources?.AbpAccount?.texts?.UserNameOrEmailAddress}
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
                    <Input
                      disabled={isLoading}
                      placeholder="Password"
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
                <AlertTitle>
                  {resources?.AbpExceptionHandling?.texts?.DefaultErrorMessage}
                </AlertTitle>
                <AlertDescription>
                  {resources?.AbpAccount?.texts?.[error]}
                </AlertDescription>
              </Alert>
            )}
            <Button
              variant="default"
              disabled={isLoading}
              className=" w-full text-white"
              type="submit"
              form="login-form"
            >
              {isLoading ? (
                <ReloadIcon className="mr-2 h-4 w-4  animate-spin" />
              ) : (
                resources?.AbpUi?.texts?.Login
              )}
            </Button>
          </form>
        </Form>
        <ForgotPasswordForm
          resources={resources}
          formSchema={defaultForgotPasswordFormSchema}
          onForgotPasswordSubmit={onForgotPasswordSubmit}
        />
        <div className="flex items-center justify-center gap-4">
          <span className="w-full h-px bg-muted" />
          <span className="text-center whitespace-nowrap text-xs uppercase text-muted-foreground">
            {resources?.AbpAccount?.texts?.OrRegisterWith}
          </span>
          <span className="w-full h-px bg-muted" />
        </div>
        <Button variant="outline" asChild className="">
          <a
            href={registerPath}
            className={`text-center cursor-pointer text-sm w-full  ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
          >
            {resources?.AbpUi?.texts?.Register}
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

// <form onSubmit={onSubmit}>
//   <div className="grid gap-4">
//     <div className="grid gap-1">
//       <Label htmlFor="email">Email</Label>
//       <Input
//         id="email"
//         placeholder="name@example.com"
//         type="email"
//         autoComplete="email"
//         ref={emailRef}
//         disabled={isLoading}
//         autoFocus
//       />
//     </div>

//     <div className="grid gap-1">
//       <Label htmlFor="password">Password</Label>
//       <Input
//         id="password"
//         placeholder="password"
//         type="password"
//         autoComplete="no"
//         disabled={isLoading}
//         ref={passwordRef}
//       />
//     </div>

//     {error && (
//       <Alert variant="destructive">
//         <ExclamationTriangleIcon className="h-4 w-4" />
//         <AlertTitle>Error</AlertTitle>
//         <AlertDescription>{error}</AlertDescription>
//       </Alert>
//     )}
//     <Button disabled={isLoading}>
//       {isLoading ? (
//         <ReloadIcon className="mr-2 h-4 w-4  animate-spin" />
//       ) : (
//         'Log in with Email'
//       )}
//     </Button>
//   </div>
// </form>
