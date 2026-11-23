# Tests

These pages hold the unit-testing conventions shared by `@xen-orchestra/web-core` and `@xen-orchestra/web` (XO 6). What only XO 6 has — its factories, its remote-resource mocks, its readers of app components, its pages — is in the [XO 6 test docs](../../web/docs/tests.md).

**Start with [Assert behavior, not implementation](./tests/assert-behavior.md)** — it is the rule the rest of this guide serves.

## Which package tests what

A behaviour is tested once, in the package that owns it:

- What a web-core component, composable, store or util does **on its own** — a select opening its options, a side panel opening on a selection, a store re-expanding on a resize — is tested in web-core.
- An XO 6 test covers what the app decides, and asserts a state it sets on a web-core component through that component's props. A test still green once the app code is removed tests web-core: write it in web-core instead, when web-core has no test for that behaviour yet.

## What to test first in web-core

1. **Logic** — `lib/utils/*.util.ts`, `lib/composables/*.composable.ts`, `lib/packages/*`, `lib/stores/*`
2. **`Vts*` building blocks with behaviour** — props, slots and variants → rendered output, emits, derived state (responsive classes, sorting, fallbacks)
3. **`Ui*` components** — their real branches only (a conditional slot, a derived label), never their styling

Every component gets tests in the medium term; until then, a change to a component adds the tests of what it touches.

## Shared test helpers

| Helper kind                                                                                   | Lives in                       | Imported as    |
| --------------------------------------------------------------------------------------------- | ------------------------------ | -------------- |
| Generic — knows only web-core components or Vue (`mountComposable`, `createGlobalTestConfig`) | `web-core/test/`               | `@core-test/…` |
| Domain-aware — knows an XO object, an XO 6 module, a remote resource                          | `@xen-orchestra/web/src/test/` | `@/test/…`     |

XO 6 tests import the generic helpers through `@core-test` too, so a helper exists once for both packages: a generic one found in `src/test/` moves to `web-core/test/` when it is next touched. The exception is the mount config: XO 6 keeps its own `createGlobalTestConfig` in `src/test/`, which installs the app configuration (form validation, real routes) and takes options; its `mountComposable` runs the web-core one with that config, and its tests import those. Never add a domain-aware helper to web-core.

## Writing a test

- [Assert behavior, not implementation](./tests/assert-behavior.md) — the one rule that outranks the others
- [File layout and structure](./tests/file-structure.md) — where a test lives, how it is named, how it is organized
- [Setup: prefer helpers over `beforeEach`](./tests/setup-helpers.md) — local helpers, auto-unmount
- [Mocking dependencies](./tests/mocking.md) — the typed `vi.mock` form (`mockModule` in XO 6), shared mock modules
- [Testing pure utilities](./tests/testing-utilities.md) — `*.util.ts`, called directly
- [Testing composables](./tests/testing-composables.md) — mounting in a Vue context, reactivity, `useI18n`
- [Testing components](./tests/testing-components.md) — `mount`, querying rendered output, translations, what `happy-dom` cannot do

## Setup in web-core

Testing uses **Vitest 4** with a single `unit` project (see `vitest.config.ts`): every test matches `**/*.unit.test.ts` and runs on `happy-dom`, CLI-only, no browser.

| Path                                | Role                                                                                                                                                                              |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vitest.config.ts`                  | Runner config: `vue` + `vue-i18n` plugins, `@core` / `@core-test` aliases, `globals: true`                                                                                        |
| `test/setup.ts`                     | Global setup: auto-unmounts every mounted wrapper after each test                                                                                                                 |
| `test/create-global-test-config.ts` | `global` mount options: the real `vue-i18n`, a Pinia and a router (needed by `useUiStore`); optional `provide`                                                                    |
| `test/i18n.ts`                      | The `t` of that `vue-i18n` instance, to build expected texts from their translation key                                                                                           |
| `test/find-accented-labels.ts`      | `findAccentedTags` / `findAccentedInfos`: each `UiTag` / `UiInfo` a wrapper renders, as `{ label, accent }`, in order (also used by XO 6)                                         |
| `test/mount-composable.ts`          | `mountComposable`: runs a composable inside a mounted component, its result read through `wrapper.vm`; takes the `global` options, `createGlobalTestConfig()` by default          |
| `test/get-success-state.ts`         | `getSuccessState`: the title, the message and the link of the `VtsSuccessStateHero` a wrapper renders, `undefined` without a title or a link (also used by XO 6)                  |
| `test/find-links.ts`                | `findLinks(wrapper, selector?)`: every `UiLink` of a wrapper (or every plain link matching `selector`) as its `[text, href]`, in order (also used by XO 6)                        |
| `test/expect-loader.ts`             | `hasLoader(wrapper)`: whether a `UiLoader` is rendered; `expectLoaderInsteadOf(wrapper, findContent)`: a `UiLoader` shown and the content it stands for empty (also used by XO 6) |
| `test/find-title.ts`                | `findTitle`: the `.title` of a `VtsSuccessStateHero` or a list item, `undefined` without one (also used by XO 6)                                                                  |
| `tsconfig.vitest.json`              | Type-checks test files with the Vitest globals and the `@core-test` alias                                                                                                         |
| `tsconfig.app.json`                 | Type-checks the library, test files excluded                                                                                                                                      |

Test files sit next to the code they test, as `lib/**/*.unit.test.ts`. Shared test infrastructure lives in `test/`, outside `lib/`. The shared `scripts/npmignore` keeps all of it out of the published package.

`@xen-orchestra/web` and `@xen-orchestra/lite` type-check `web-core/lib` as part of their own sources: their app tsconfigs exclude its `*.unit.test.ts`, which they would otherwise check without the Vitest globals. How XO 6 imports `web-core/test/` is in its [test runner](../../web/docs/tests/running-tests.md) page.

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
