# 📦 React • Typescript • ShadcnUI • UI Package

## 🏃 Getting started

```console
pnpm i && pnpm dev
```

## What's included?

- [Extends on this](https://github.com/TimMikeladze/tsup-react-package-starter) - Package starter
- ⚡️[tsup](https://github.com/egoist/tsup) - The simplest and fastest way to bundle your TypeScript libraries. Used to bundle package as ESM and CJS modules. Supports TypeScript, Code Splitting, PostCSS, and more out of the box.
- 📖 [Storybook](https://storybook.js.org/) - Build UI components and pages in isolation. It streamlines UI development, testing, and documentation.
- 🧪 [Vitest](https://vitest.dev/) - A testing framework for JavaScript. Preconfigured to work with TypeScript and JSX.
- 🔼 [Release-it](https://github.com/release-it/release-it/) - release-it is a command line tool to automatically generate a new GitHub Release and populates it with the changes (commits) made since the last release.
- 🐙 [Test & Publish via Github Actions](https://docs.github.com/en/actions) - CI/CD workflows for your package. Run tests on every commit plus integrate with Github Releases to automate publishing package to NPM and Storybook to Github Pages.
- 📄 [Commitizen](https://github.com/commitizen/cz-cli) — When you commit with Commitizen, you'll be prompted to fill out any required commit fields at commit time.
- 🐶 [Husky](https://github.com/typicode/husky) — Run scripts before committing.
- 🚫 [lint-staged](https://github.com/okonet/lint-staged) — Run linters on git staged files
- 🤖 [Dependabot](https://docs.github.com/en/code-security/dependabot) - Github powered dependency update tool that fits into your workflows. Configured to periodically check your dependencies for updates and send automated pull requests.
- ☑️ [ESLint](https://eslint.org/) - A linter for JavaScript. Includes a simple configuration for React projects based on the recommended ESLint and AirBnB configs.
- 🎨 [Prettier](https://prettier.io/) - An opinionated code formatter.
- 🏃‍♀️‍➡️ [TSX](https://github.com/privatenumber/tsx) - Execute TypeScript files with zero-config in a Node.js environment.
- 🖌️ [Tailwind](https://tailwindcss.com/) - Tailwind CSS is a utility-first CSS framework for rapidly building modern websites without ever leaving your HTML.

## Usage

### 💻 Developing

```console
pnpm dev
```

```console
pnpm test
```

### 🏗️ Building

Build package with `tsup` for production.

```console
pnpm build
```

### ▶️ Running files written in TypeScript

To execute a file written in TypeScript inside a Node.js environment, use the `tsx` command. This will detect your `tsconfig.json` and run the file with the correct configuration. This is perfect for running custom scripts while remaining type-safe.

```console
pnpm tsx ./path/to/file.ts
```

This is useful for running scripts, starting a server, or any other code you want to run while remaining type-safe.

### 🖇️ Linking

Often times you want to `link` this package to another project when developing locally, circumventing the need to publish to NPM to consume it.

In a project where you want to consume your package run:

```console
pnpm link my-package --global
```

Learn more about package linking [here](https://pnpm.io/cli/link).

### 📩 Committing

When you are ready to commit simply run the following command to get a well formatted commit message. All staged files will automatically be linted and fixed as well.

```console
pnpm commit
```

### 🔖 Releasing, tagging & publishing to NPM

Create a semantic version tag and publish to Github Releases. When a new release is detected a Github Action will automatically build the package and publish it to NPM. Additionally, a Storybook will be published to Github pages.

Learn more about how to use the `release-it` command [here](https://github.com/release-it/release-it).

```console
pnpm release
```

When you are ready to publish to NPM simply run the following command:

```console
pnpm publish
```

#### 🤖 Auto publish after Github Release (or manually by dispatching the Publish workflow)

❗Important note: in order to automatically publish a Storybook on Github Pages you need to open your repository settings, navigate to "Actions" and enable **"Read & write permissions"** for Workflows. Then navigate to "Pages" and choose **"GitHub Actions"** as the source for the Build and Deployment. After a successful deployment you can find your Storybook at `https://<your-github-username>.github.io/<your-repository-name>/`.

❗Important note: in order to publish package to NPM you must add your token as a Github Action secret. Learn more on how to configure your repository and publish packages through Github Actions [here](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages).

# Using ayasofyazilim-ui in turborepo

## Creating ayasofyazilim project using turborepo starter template

Run the following command:

```console
pnpm dlx create-turbo@latest -e with-tailwind my-package pnpm
```

# Changes to do;

### Adding ayasofyazilim-ui submodule
```console
cd packages
git submodule add https://github.com/ayasofyazilim-clomerce/ayasofyazilim-ui.git
```
### Adding ayasofyazilim-ui to app
```console
pnpm add @repo/ayasofyazilim-ui --filter web
```
### Configuring tailwindcss

1. Update apps/web/tailwind.config.ts

```ts
// tailwind config is required for editor support

import type { Config } from 'tailwindcss';
import sharedConfig from '@repo/tailwind-config';

const config: Pick<Config, 'content' | 'presets' | 'theme'> = {
  content: [
    './src/app/**/*.tsx',
    './node_modules/@repo/ayasofyazilim-ui/**/*.{ts,tsx}',
  ],
  presets: [sharedConfig],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
};

export default config;
```

2. Update apps/web/src/app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 142.1 76.2% 36.3%;
    --primary-foreground: 355.7 100% 97.3%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 142.1 76.2% 36.3%;
    --radius: 0rem;
  }

  .dark {
    --background: 20 14.3% 4.1%;
    --foreground: 0 0% 95%;
    --card: 24 9.8% 10%;
    --card-foreground: 0 0% 95%;
    --popover: 0 0% 9%;
    --popover-foreground: 0 0% 95%;
    --primary: 142.1 70.6% 45.3%;
    --primary-foreground: 144.9 80.4% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 15%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 12 6.5% 15.1%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 85.7% 97.3%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 142.4 71.8% 29.2%;
  }
}
```
.
## Component usage example

```tsx
import { Button } from '@repo/ayasofyazilim-ui/button';
```
```tsx
<Button variant={'destructive'}>Test</Button>
```
