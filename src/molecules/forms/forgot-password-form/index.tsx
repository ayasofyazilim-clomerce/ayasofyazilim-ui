'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ReplaceHolders } from '../../../lib';

export const defaultForgotPasswordFormSchema = z.object({
  email: z
    .string()
    .email(
      ReplaceHolders(
        localeTr.resources.AbpValidation.texts[
          'The {0} field is not a valid e-mail address.'
        ],
        { '{0}': localeTr.resources?.AbpAccount?.texts?.EmailAddress }
      ).join(' ')
    ),
  appName: z.string(),
});

export type ForgotPasswordFormDataType = {
  appName: string;
  email: string;
};

export type ForgotPasswordPropsType = {
  formSchema: z.ZodObject<any>;
  onSubmitFunction?: (values: ForgotPasswordFormDataType) => Promise<string>;
  resources?: { [key: string]: any };
};

export default function ForgotPasswordForm({
  onSubmitFunction,
  formSchema,
  resources = localeTr.resources,
}: ForgotPasswordPropsType) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');

  const form = useForm<ForgotPasswordFormDataType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      appName: '',
    },
  });

  function onSubmit(values: ForgotPasswordFormDataType) {
    setIsLoading(true);
    if (onSubmitFunction)
      onSubmitFunction(values)
        .then(() => {
          setError('');
        })
        .catch((result) => {
          setError(result);
          console.log(error);
          setIsLoading(false);
        });
  }

  return (
    <Dialog>
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
            {resources?.AbpAccount?.texts?.SendPasswordResetLink_Information}
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
                      disabled={isLoading}
                      placeholder="name@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className="pt-4">
          <Button type="submit" form="forgot-password-form">
            {resources?.AbpUi?.texts?.Submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
