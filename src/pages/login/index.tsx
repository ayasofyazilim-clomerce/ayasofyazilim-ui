'use client';

import React from 'react';
import { z } from 'zod';
import { ForgotPasswordFormDataType } from 'src/molecules/forms/forgot-password-form';
import LoginForm, { LoginFormDataType } from '../../molecules/forms/login-form';
import { CountrySelector } from '../../organisms/country-selector';
import { TwoColumnLayout } from '../../templates/two-column-layout';

export const lang = {
  searchText: 'Find',
  searchEmptyValue: 'No country found.',
  defaultValue: {
    label: 'Test',
    value: 'tr',
  },
  countries: [
    {
      cultureName: 'de-DE',
      uiCultureName: 'de-DE',
      displayName: 'Deutsch',
      flagIcon: 'de',
      isEnabled: true,
      isDefaultLanguage: false,
      concurrencyStamp: 'febeac3b19854ee38eebb3941813aca3',
      creationTime: '2024-03-21T08:43:33.6901807',
      creatorId: null,
      id: 'd914deaa-6a58-0583-7284-3a1171b61639',
      extraProperties: {},
    },
    {
      cultureName: 'en',
      uiCultureName: 'en',
      displayName: 'English',
      flagIcon: 'gb',
      isEnabled: true,
      isDefaultLanguage: true,
      concurrencyStamp: '1a736aee0303420f9394ce3a98523e34',
      creationTime: '2024-03-21T08:43:33.6867177',
      creatorId: null,
      id: '75fe277d-5138-285d-8088-3a1171b61635',
      extraProperties: {},
    },
    {
      cultureName: 'es',
      uiCultureName: 'es',
      displayName: 'Español',
      flagIcon: 'es',
      isEnabled: true,
      isDefaultLanguage: false,
      concurrencyStamp: 'a45cf9bafcd54640a5b38616f0eaaa32',
      creationTime: '2024-03-21T08:43:33.6903694',
      creatorId: null,
      id: '6afd112b-416e-f4e1-8951-3a1171b6163a',
      extraProperties: {},
    },
    {
      cultureName: 'fi',
      uiCultureName: 'fi',
      displayName: 'Finnish',
      flagIcon: 'fi',
      isEnabled: true,
      isDefaultLanguage: false,
      concurrencyStamp: '59cc6a2cdd104cc4bc72afd2a3c68bbe',
      creationTime: '2024-03-21T08:43:33.6875651',
      creatorId: null,
      id: 'a47a6047-210a-aea4-5147-3a1171b61637',
      extraProperties: {},
    },
    {
      cultureName: 'fr',
      uiCultureName: 'fr',
      displayName: 'Français',
      flagIcon: 'fr',
      isEnabled: true,
      isDefaultLanguage: false,
      concurrencyStamp: '251c825e793e4285a6048f46a3a565f8',
      creationTime: '2024-03-21T08:43:33.687987',
      creatorId: null,
      id: 'ca7b3d34-2a31-ec88-e708-3a1171b61637',
      extraProperties: {},
    },
    {
      cultureName: 'hi',
      uiCultureName: 'hi',
      displayName: 'Hindi',
      flagIcon: 'in',
      isEnabled: true,
      isDefaultLanguage: false,
      concurrencyStamp: '3e419b20898349f7a12df389411ccd67',
      creationTime: '2024-03-21T08:43:33.6882853',
      creatorId: null,
      id: '77c40193-429a-14e2-a84d-3a1171b61638',
      extraProperties: {},
    },
    {
      cultureName: 'it',
      uiCultureName: 'it',
      displayName: 'Italiano',
      flagIcon: 'it',
      isEnabled: true,
      isDefaultLanguage: false,
      concurrencyStamp: '22b1853670a84b4cbe7b6433b5cbfc59',
      creationTime: '2024-03-21T08:43:33.6885261',
      creatorId: null,
      id: '98e3fc3b-e236-29f0-02fa-3a1171b61638',
      extraProperties: {},
    },
    {
      cultureName: 'sk',
      uiCultureName: 'sk',
      displayName: 'Slovak',
      flagIcon: 'sk',
      isEnabled: true,
      isDefaultLanguage: false,
      concurrencyStamp: '3549993267a948a0850eca2aa10369c5',
      creationTime: '2024-03-21T08:43:33.6887239',
      creatorId: null,
      id: 'c41b735d-3a0f-1384-94e9-3a1171b61638',
      extraProperties: {},
    },
    {
      cultureName: 'sl',
      uiCultureName: 'sl',
      displayName: 'Slovenščina',
      flagIcon: 'si',
      isEnabled: true,
      isDefaultLanguage: false,
      concurrencyStamp: '0e651c699ffb42c1aa6094ed88ca6fab',
      creationTime: '2024-03-21T08:43:33.68955',
      creatorId: null,
      id: 'f0142c88-8dd2-f68e-25e1-3a1171b61639',
      extraProperties: {},
    },
    {
      cultureName: 'tr',
      uiCultureName: 'tr',
      displayName: 'Türkçe',
      flagIcon: 'tr',
      isEnabled: true,
      isDefaultLanguage: false,
      concurrencyStamp: '095c8922c1b148bd9e161beca3c635ac',
      creationTime: '2024-03-21T08:43:33.6892353',
      creatorId: null,
      id: 'a8483e30-e0e6-e4e8-f2ff-3a1171b61638',
      extraProperties: {},
    },
    {
      cultureName: 'ru',
      uiCultureName: 'ru',
      displayName: 'Русский',
      flagIcon: 'ru',
      isEnabled: true,
      isDefaultLanguage: false,
      concurrencyStamp: '39294b26014946f69ef5997122a0d6ff',
      creationTime: '2024-03-21T08:43:33.6889293',
      creatorId: null,
      id: '67cb512a-a7b8-f43a-7c9d-3a1171b61638',
      extraProperties: {},
    },
    {
      cultureName: 'ar',
      uiCultureName: 'ar',
      displayName: 'العربية',
      flagIcon: 'ae',
      isEnabled: true,
      isDefaultLanguage: false,
      concurrencyStamp: 'dc72f4dcd7394bdab525a815af101c9f',
      creationTime: '2024-03-21T08:43:33.6857081',
      creatorId: null,
      id: '315edb5c-557d-6981-a84d-3a1171b61617',
      extraProperties: {},
    },
    {
      cultureName: 'zh-Hans',
      uiCultureName: 'zh-Hans',
      displayName: '简体中文',
      flagIcon: 'cn',
      isEnabled: true,
      isDefaultLanguage: false,
      concurrencyStamp: 'bbbbef67f9684f6496cadea3de8e909c',
      creationTime: '2024-03-21T08:43:33.6897489',
      creatorId: null,
      id: '04220b42-2076-85a2-f524-3a1171b61639',
      extraProperties: {},
    },
    {
      cultureName: 'zh-Hant',
      uiCultureName: 'zh-Hant',
      displayName: '繁體中文',
      flagIcon: 'tw',
      isEnabled: true,
      isDefaultLanguage: false,
      concurrencyStamp: 'dfb40e422041466ebb9e370b6f968991',
      creationTime: '2024-03-21T08:43:33.6899437',
      creatorId: null,
      id: '3923f492-d944-b802-d3f9-3a1171b61639',
      extraProperties: {},
    },
  ],
};

export type LoginPropsType = {
  allowTenantChange: boolean;
  children: React.ReactNode;
  cultureName: string;
  formSchema: z.ZodObject<any>;
  onForgotPasswordSubmit?: (
    values: ForgotPasswordFormDataType
  ) => Promise<string>;
  onLangChange: (cultureName: string) => void;
  onSubmitFunction: (email: LoginFormDataType) => Promise<string>;
  registerPath: string;
  resources: { [key: string]: any };
};

export const Login = ({
  onSubmitFunction,
  onForgotPasswordSubmit,
  formSchema,
  allowTenantChange,
  children,
  registerPath,
  resources,
  cultureName = 'tr',
  onLangChange,
}: LoginPropsType) => (
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
        <LoginForm
          onSubmitFunction={onSubmitFunction}
          formSchema={formSchema}
          allowTenantChange={allowTenantChange}
          onForgotPasswordSubmit={onForgotPasswordSubmit}
          registerPath={registerPath}
          resources={resources}
        />
      </div>
    }
  />
);
