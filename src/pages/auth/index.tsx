'use client';

import React from 'react';
import RegisterForm, {
  RegisterFormPropsType,
} from '../../molecules/forms/register-form';
import LoginForm, {
  LoginFormPropsType,
} from '../../molecules/forms/login-form';
import { CountrySelector, lang } from '../../organisms/country-selector';
import { TwoColumnLayout } from '../../templates/two-column-layout';
import ResetPasswordForm, {
  ResetPasswordFormPropsType,
} from '../../molecules/forms/reset-password-form';

export type authTypes = 'login' | 'register' | 'reset-password';
export const isAuthType = (value: string): value is authTypes =>
  ['login', 'register', 'reset-password'].indexOf(value as authTypes) !== -1;
export type AuthPropsType = {
  authProps: LoginFormPropsType &
    RegisterFormPropsType &
    ResetPasswordFormPropsType;
  authType: authTypes;
  children: JSX.Element;
  cultureName: string;
  onLangChange: (cultureName: string) => void;
  resources: { [key: string]: any };
};
function formSwitch(
  authType: authTypes,
  resources: { [key: string]: any },
  authProps: LoginFormPropsType &
    RegisterFormPropsType &
    ResetPasswordFormPropsType
) {
  switch (authType) {
    case 'login':
      return <LoginForm {...authProps} resources={resources} />;
    case 'register':
      return <RegisterForm {...authProps} resources={resources} />;
    case 'reset-password':
      return <ResetPasswordForm {...authProps} resources={resources} />;
    default:
      return resources?.AbpExceptionHandling?.texts
        .DefaultErrorMessage404Detail;
  }
}

export const Auth = ({
  authType,
  resources,
  cultureName,
  onLangChange,
  children,
  authProps,
}: AuthPropsType) => (
  <TwoColumnLayout
    LeftNode={children}
    RightNode={
      <div className="flex-auto flex">
        <div className="absolute right-4 top-4 md:right-10 md:top-8">
          <CountrySelector
            menuAlign="end"
            countries={lang.countries}
            defaultValue={cultureName}
            onValueChange={onLangChange}
          />
        </div>
        {formSwitch(authType, resources, authProps)}
      </div>
    }
  />
);
