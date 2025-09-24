# Mantine Vite template

## Features

This template comes with the following features:

- [PostCSS](https://postcss.org/) with [mantine-postcss-preset](https://mantine.dev/styles/postcss-preset)
- [TypeScript](https://www.typescriptlang.org/)
- [Storybook](https://storybook.js.org/)
- [Vitest](https://vitest.dev/) setup with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- ESLint setup with [eslint-config-mantine](https://github.com/mantinedev/eslint-config-mantine)

## npm scripts

## Build and dev scripts

- `dev` – start development server
- `build` – build production version of the app
- `preview` – locally preview production build

### Testing scripts

- `typecheck` – checks TypeScript types
- `lint` – runs ESLint
- `prettier:check` – checks files with Prettier
- `vitest` – runs vitest tests
- `vitest:watch` – starts vitest watch
- `test` – runs `vitest`, `prettier:check`, `lint` and `typecheck` scripts

### Other scripts

- `storybook` – starts storybook dev server
- `storybook:build` – build production storybook bundle to `storybook-static`
- `prettier:write` – formats all files with Prettier

## API configuration

The application uses [TanStack Query](https://tanstack.com/query/latest) for server state management. Configure the backend origin with the `VITE_API_BASE_URL` environment variable. When the variable is not provided during development, the app defaults to `http://localhost:8000`.

Create a `.env.local` file to override the backend location:

```
VITE_API_BASE_URL=https://your-production-api.example.com
```

## Discord login configuration

Discord authentication is handled by Supabase. The frontend constructs the full Supabase authorize URL (including the OAuth
state parameter) at runtime, so no additional code changes or manual query parameters are required. To make sure the redirect
completes successfully you only need to:

1. Enable the Discord provider in the Supabase dashboard and supply the Discord client ID/secret.
2. Add the application origin (for example, `http://localhost:5173` during local development) to **Authentication → URL configuration → Redirect URLs** so Supabase is allowed to send the user back to the app.

Once those two Supabase settings are in place, the login button will redirect through Supabase and complete the Discord OAuth
flow without any further setup in this repository.
