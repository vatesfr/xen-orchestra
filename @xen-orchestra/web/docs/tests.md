# Testing

This guide documents the unit-testing conventions used in `@xen-orchestra/web`, as established across the `pool`, `host` and `vm` modules. Follow it when adding tests for a new module, composable, utility or component.

**Start with [Assert behaviour, not implementation](./tests/assert-behaviour.md)** — it is the rule the rest of this guide serves.

## What to test first

A fixed priority, not a preference:

1. **Components that make up a page** (`modules/<mod>/components/**`) — top priority, **equal with** the next entry
2. **Composables and utilities** (`*.composable.ts`, `*.util.ts`) — top priority
3. **Pages** (`src/pages/**`) — lowest, and deliberately thin: assert which components render, never their values

Testing a page is a different job from testing a component, and the component is the more valuable one. A component should not carry much complex logic — when it does, extract that into a composable or utility and test it there.

### Only the app's own behaviour

An XO 6 test covers what the app decides, never what `@xen-orchestra/web-core` does on its own: a side panel opening on a selection, a store re-expanding on a resize, a select opening its options all belong to the web-core tests. A web-core component may be rendered beside the code under test when the app's rule depends on it, but the assertion must be about that rule: a test that still passes once the app's code is removed is testing web-core and is deleted, not written. A composable member that only forwards to a web-core store gets no test of its own. Selects: see [Testing components](./tests/testing-components.md#selects).

## Getting started

- [Assert behaviour, not implementation](./tests/assert-behaviour.md) — the one rule that outranks the others
- [Test runner](./tests/running-tests.md) — Vitest setup and the commands to run a suite

## Writing a test

- [File layout and structure](./tests/file-structure.md) — where a test lives, how it is named, how it is organised
- [Setup: prefer helpers over `beforeEach`](./tests/setup-helpers.md) — local helpers, and the shared `use<X>EnhancedData` ones
- [Test data factories](./tests/factories.md) — the `src/test/create*` factories and how to use them

## What you are testing

- [Testing pure utilities](./tests/testing-utilities.md) — `*.util.ts`, called directly
- [Testing composables](./tests/testing-composables.md) — `mountComposable`, reactivity, `useI18n`
- [Testing components](./tests/testing-components.md) — `mount`, querying rendered output, and what `happy-dom` cannot do
- [Mocking dependencies](./tests/mocking.md) — the typed `vi.mock` form, and the network stub
