# Test runner

Testing uses **Vitest 4** with a single `unit` project (see `vite.config.ts`): every test matches `**/*.unit.test.ts` and runs on `happy-dom`, CLI-only, no browser.

Utilities, composables **and components** all run there — mounting a component needs `@vue/test-utils`, not a browser. Only real-CSS and layout assertions are out of reach; see [Testing components](./testing-components.md).

`test.alias` in that config maps `placement.js` to its ESM build: the package only declares a `module` entry, which the Node-style resolution used by Vitest ignores, so any component pulling in a menu fails to resolve it otherwise.

## Running tests

`yarn test` runs the suite once and exits. A bare `yarn vitest` starts watch mode, which
reruns the affected tests on every save — that is the one to use while developing.

```sh
cd @xen-orchestra/web

# Run the whole suite once
yarn test

# Watch mode
yarn vitest

# Watch a single module
yarn vitest src/modules/vm/

# Browse and re-run tests from the Vitest UI
yarn test:ui
```
