# Test runner

XO 6 runs the same setup as web-core ([Setup in web-core](../../../web-core/docs/tests.md#setup-in-web-core)), configured in `vite.config.ts` (`test`).

`test.alias` in that config maps `placement.js` to its ESM build: the package only declares a `module` entry, which the Node-style resolution used by Vitest ignores, so any component pulling in a menu fails to resolve it otherwise. It also maps `@core-test` to `web-core/test/`, the generic helpers shared with the web-core tests (see [Shared test helpers](../../../web-core/docs/tests.md#shared-test-helpers)); `tsconfig.vitest.json` declares the same path.

## Isolation and order

The test files share their modules (`isolate: false`): a worker loads a module once for every file it runs, which makes the suite about 7 times faster than isolating each file. It holds because no test file mocks a module itself (see [Mocking dependencies](./mocking.md)) and every test resets the state it sets.

The files run in a random order (`sequence.shuffle.files`), on 4 workers: a test leaking state into another file fails instead of passing by luck. Each run prints its seed (`Running tests with seed "…"`): replay a failing order with `yarn vitest run --sequence.seed=<seed>`.

The tests load the English messages only (`vueI18n` `include` in test mode): the other locales cost about 30 % of the run time and memory, and no test switches locale. A test needing another locale's messages has to widen that `include` first.

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
