# Test runner

XO 6 runs the same setup as web-core ([Setup in web-core](../../../web-core/docs/tests.md#setup-in-web-core)), configured in `vite.config.ts` (`test`).

`test.alias` in that config maps `placement.js` to its ESM build: the package only declares a `module` entry, which the Node-style resolution used by Vitest ignores, so any component pulling in a menu fails to resolve it otherwise. It also maps `@core-test` to `web-core/test/`, the generic helpers shared with the web-core tests (see [Shared test helpers](../../../web-core/docs/tests.md#shared-test-helpers)); `tsconfig.vitest.json` declares the same path.

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
