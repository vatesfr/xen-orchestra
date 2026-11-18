# Tests

Testing uses **Vitest 4** with a single `unit` project (see `vitest.config.ts`): every test matches `**/*.unit.test.ts` and runs on `happy-dom`, CLI-only, no browser. Conventions follow the [XO 6 test docs](../../web/docs/tests.md).

| Path                                | Role                                                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `vitest.config.ts`                  | Runner config: `vue` + `vue-i18n` plugins, `@core` / `@core-test` aliases, `globals: true`            |
| `test/setup.ts`                     | Global setup: auto-unmounts every mounted wrapper after each test                                     |
| `test/create-global-test-config.ts` | `global` mount options: the real `vue-i18n`, a Pinia and a router (needed by `useUiStore`)            |
| `test/mount-composable.ts`          | `mountComposable`: runs a composable inside a mounted component, its result read through `wrapper.vm` |
| `tsconfig.vitest.json`              | Type-checks test files with the Vitest globals and the `@core-test` alias                             |
| `tsconfig.app.json`                 | Type-checks the library, test files excluded                                                          |

Test files sit next to the code they test, as `lib/**/*.unit.test.ts`. Shared test infrastructure lives in `test/`, outside `lib/`. The shared `scripts/npmignore` keeps all of it out of the published package.

`@xen-orchestra/web` and `@xen-orchestra/lite` type-check `web-core/lib` as part of their own sources: their tsconfigs exclude the web-core test files, which they would otherwise check without the Vitest globals.

`test.alias` maps `placement.js` to its ESM build: the package only declares a `module` entry, which the Node-style resolution used by Vitest ignores.

## Running tests

```sh
cd @xen-orchestra/web-core

# Type-check, then run the whole suite once
yarn test

# Watch mode
yarn vitest

# Browse and re-run tests from the Vitest UI
yarn test:ui

# Type-check the library and the tests
yarn type-check
```
