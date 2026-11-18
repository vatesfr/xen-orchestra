# Testing

This guide documents what is specific to the unit tests of `@xen-orchestra/web` (XO 6). The conventions shared with `@xen-orchestra/web-core` — assert behavior, file layout, setup helpers, mocking, utilities, composables, components — live in the [web-core test docs](../../web-core/docs/tests.md): read them first.

**Start with [Assert behavior, not implementation](../../web-core/docs/tests/assert-behavior.md)** — it is the rule the rest of this guide serves.

## What to test first

A fixed priority, not a preference:

1. **Components that make up a page** (`modules/<mod>/components/**`) — top priority, **equal with** the next entry
2. **Composables and utilities** (`*.composable.ts`, `*.util.ts`) — top priority
3. **Pages** (`src/pages/**`) — lowest, and deliberately thin: assert which components render, never their values

Testing a page is a different job from testing a component, and the component is the more valuable one. A component should not carry much complex logic — when it does, extract that into a composable or utility and test it there.

### Only the app's own behaviour

An XO 6 test covers what the app decides, never what `@xen-orchestra/web-core` does on its own: that is tested in web-core (see [Which package tests what](../../web-core/docs/tests.md#which-package-tests-what)). A web-core component may be rendered beside the code under test when the app's rule depends on it, but the assertion must be about that rule. A state the app sets on a web-core component (`busy`, `disabled`, `selected`, a table `state`…) is asserted through that component's props (`getUiButton(wrapper, label).props('busy')`), never through the DOM it renders for it; a user action clicks the real `<button>` (`getButton(wrapper, label)`). A composable member that only forwards to a web-core store gets no test of its own. Selects: see [Testing components](./tests/testing-components.md#selects).

## Shared conventions (web-core docs)

- [Assert behavior, not implementation](../../web-core/docs/tests/assert-behavior.md)
- [File layout and structure](../../web-core/docs/tests/file-structure.md)
- [Shared test helpers](../../web-core/docs/tests.md#shared-test-helpers) — generic helpers in `web-core/test/` (`@core-test`), domain-aware ones in `src/test/`

## XO 6 specifics

- [Test runner](./tests/running-tests.md) — Vitest setup and the commands to run a suite
- [Setup helpers](./tests/setup-helpers.md) — local storage, the shared `use<X>EnhancedData` helpers
- [Test data factories](./tests/factories.md) — the `src/test/create*` factories and helpers
- [Utilities](./tests/testing-utilities.md) — where XO 6 keeps shared utils
- [Composables](./tests/testing-composables.md) — `mountComposable`, `mountComposableWithI18n`
- [Components](./tests/testing-components.md) — the `src/test/` readers, tables, charts, legends, routing, selects, pages
- [Mocking](./tests/mocking.md) — the shared remote-resource mocks, and the network stub
