'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  ExclamationTriangleIcon,
  CheckCircledIcon,
} from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';

import localeTr from '../../../locale_tr.json';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { replacePlaceholders } from '../../../lib/replace-placeholders';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const defaultForgotPasswordFormSchema = z.object({
  email: z.string().email(
    replacePlaceholders(
      localeTr.resources.AbpValidation.texts[
        'The {0} field is not a valid e-mail address.'
      ],
      [
        {
          holder: '{0}',
          replacement: localeTr.resources?.AbpAccount?.texts?.EmailAddress,
        },
      ]
    ).join(' ')
  ),
});

export type ForgotPasswordFormDataType = {
  appName: string;
  email: string;
  returnUrl: string;
  returnUrlHash: string;
};

export type ForgotPasswordFormPropsType = {
  formSchema: z.ZodObject<any>;
  onForgotPasswordSubmit?: (
    values: ForgotPasswordFormDataType
  ) => Promise<string>;
  resources?: { [key: string]: any };
};

export default function ForgotPasswordForm({
  onForgotPasswordSubmit,
  formSchema,
  resources = localeTr.resources,
}: ForgotPasswordFormPropsType) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [alert, setAlert] = React.useState<
    | {
        message: React.ReactNode | string | null;
        variant: 'default' | 'destructive';
      }
    | undefined
  >();

  const form = useForm<ForgotPasswordFormDataType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  function onSubmit(values: ForgotPasswordFormDataType) {
    if (onForgotPasswordSubmit) {
      setIsLoading(true);
      onForgotPasswordSubmit(values)
        .then(() => {
          setAlert({
            variant: 'default',
            message: resources?.AbpAccount?.texts?.PasswordResetMailSentMessage,
          });
          setIsLoading(false);
        })
        .catch(() => {
          setAlert({
            variant: 'destructive',
            message: replacePlaceholders(
              resources?.AbpAccount?.texts?.[
                'Volo.Account:InvalidEmailAddress'
              ],
              [
                {
                  holder: '{0}',
                  replacement: values.email,
                },
              ]
            ),
          });
          setIsLoading(false);
        });
    }
  }

  return (
    <Dialog onOpenChange={() => setAlert(undefined)}>
      <DialogTrigger asChild>
        <Button
          variant="link"
          disabled={isLoading}
          type="button"
          className="text-xs p-0 h-4 w-full justify-end"
        >
          {resources?.AbpAccount?.texts?.ForgotPassword}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {resources?.AbpAccount?.texts?.ForgotPassword}
          </DialogTitle>
          <DialogDescription>
            {!alert || alert.variant !== 'default'
              ? resources?.AbpAccount?.texts?.SendPasswordResetLink_Information
              : ''}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-2"
            id="forgot-password-form"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {resources?.AbpAccount?.texts?.EmailAddress}
                  </FormLabel>
                  <FormControl>
                    <Input
                      disabled={
                        isLoading || (alert && alert.variant === 'default')
                      }
                      placeholder="name@example.com"
                      {...field}
                    />
                  </FormControl>
                  {alert && (
                    <Alert variant={alert.variant}>
                      {alert.variant === 'destructive' ? (
                        <ExclamationTriangleIcon className="h-4 w-4" />
                      ) : (
                        <CheckCircledIcon className="h-4 w-4" />
                      )}
                      <AlertTitle>
                        {alert.variant === 'destructive' &&
                          resources?.AbpAuditLogging?.texts?.Fault}
                        {alert.variant === 'default' &&
                          resources?.AbpUi?.texts?.Success}
                      </AlertTitle>
                      <AlertDescription>{alert.message}</AlertDescription>
                    </Alert>
                  )}
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              {!alert || alert.variant !== 'default' ? (
                <Button type="submit" disabled={isLoading}>
                  {resources?.AbpUi?.texts?.Submit}
                </Button>
              ) : (
                ''
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
