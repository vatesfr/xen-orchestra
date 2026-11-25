# Testing components

Components run in the same `unit` project as everything else: `@vue/test-utils` `mount` on `happy-dom`, **no browser needed**. Mount with the package's `createGlobalTestConfig()` (`@core-test/create-global-test-config.ts` in web-core, `@/test/global-test-config.ts` in XO 6), and give the repeated mount a helper (see [Setup](./setup-helpers.md)):

```typescript
import VtsSuccessStateHero from '@core/components/success-state-hero/VtsSuccessStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { mount } from '@vue/test-utils'

function mountSuccessStateHero() {
  return mount(VtsSuccessStateHero, {
    global: createGlobalTestConfig(),
    slots: { default: 'Message' },
  })
}

it('renders the message in a success alert', () => {
  const alert = mountSuccessStateHero().getComponent(UiAlert)

  expect(alert.props('accent')).toBe('success')
  expect(alert.text()).toBe('Message')
})
```

Where the test file lives and how it groups its tests: see [File layout and structure](./file-structure.md).

## What a web-core component test covers

A web-core component is tested for its **contract with its consumers**: what each prop, slot and variant renders, what it emits on a user action, the state it derives (responsive classes, a sort, a fallback). Not its styling — see [What `happy-dom` cannot do](#what-happy-dom-cannot-do).

- A variant is asserted through the class `toVariants` gives it, since that class is the contract the CSS reads — never through a style.
- A child web-core component is asserted through its props (`getComponent(UiAlert).props('accent')`), not the DOM it renders: that child has its own test.
- A responsive state is driven with `setViewportWidth(width)` (`@core-test/set-viewport-width.ts`) before mounting.

## Keep components thin

A component should not carry much complex logic. Non-trivial computation (series, aggregation, formatting rules) belongs in a `*.util.ts` or a composable, tested directly — that is cheaper and covers more branches than mounting. A component that is awkward to test is telling you to **extract**, not to write a heavier component test, and never to skip the test.

What is left to assert at the component level is what it renders: labels, formatted values, conditional rows, empty states.

### Extracting from a tested component

The extraction is a refactor, so the tests come **first** and are what proves it changed nothing:

1. Write the tests against the component **as it stands**, and run them green.
2. Extract.
3. Re-run those tests **unchanged**.
4. Move the ones the extraction made redundant down next to the new util/composable, and delete them from the component test.

Step 3 is the gate. A test that has to be edited to pass is reporting a behavior change — say so, do not absorb it into the diff. Tests written only _after_ an extraction describe the new code and cannot catch what the extraction broke, which is the whole risk being taken.

Step 4 is selective. A test that only exercised the logic now living in the util moves; a test asserting something the component alone does — rendering, conditional rows, empty states, feeding the util's output into the template — stays.

## Assert what the user reads, not the markup

`wrapper.text()` concatenates the whole subtree **with no separators**, so `'8 B'` and `'Disabled'` run together. It is fine for `toContain` on a single component, but it cannot express "this label has this value". Query instead:

```typescript
// every key/value row: `VtsKeyValuePair` renders a semantic `dt.label` and `dd.value`
const rows = wrapper.findAll('.vts-tabular-key-value-row')
const labelledValues = Object.fromEntries(rows.map(row => [row.get('dt.label').text(), row.get('dd.value').text()]))

expect(labelledValues).toEqual({ [t('name')]: 'Item 1', [t('status')]: t('enabled') })
```

Prefer this shape, one assertion covering every row a user sees: it fails loudly when a value lands under the wrong label. Assert against **class names and semantic elements**, never a positional chain of child indexes.

The class must exist for the component's own CSS: **never add a class only for a test**, and remove one whose CSS is gone. Without a styled class, query the component (`getComponent`), a styled class of a child component, or the text the user reads.

A query a second test file needs becomes a shared reader (see [Shared test helpers](../tests.md#shared-test-helpers)); XO 6 already has many, listed in [XO 6 components](../../../web/docs/tests/testing-components.md).

### Never spell out a translation

A rendered label or a translated value is wording the component does not own, so [asserting behavior](./assert-behavior.md) means naming the **key**, not the English string, through the `t` of the very instance the mount installs:

```typescript
// ✗ rewording the translation breaks the test although the component still picks the same key
expect(wrapper.get('.value').text()).toBe('None')

// ✓ asserts the decision: the value falls back to the "none" wording
expect(wrapper.get('.value').text()).toBe(t('none'))
```

A mistyped key does not pass quietly — `t` returns a marker for a key the locale has no entry for, which matches no rendered text.

Where the line falls:

| Value                                                      | Assert as                                                                          |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| a label, or a value that is itself a translation           | `t('key')` — including a plural, `t('n-warnings', 2)`                              |
| a formatted date                                           | `formatDateTime(timestamp)` from `@core/utils/time.util.ts`, as the component does |
| a string the component composes from several translations  | a template literal of those `t(…)` calls                                           |
| data reaching the component (a name, an id, an IP, a tag)  | the literal — it is the test's own input                                           |
| a number the component formats (`'8 B'`, `'4 GiB'`, `'2'`) | the literal — deriving it would copy the template                                  |

## What `happy-dom` cannot do

There is no layout engine, and Vitest's `css` option is off, so component styles are never loaded. Out of reach:

- `toBeVisible()` and anything depending on real visibility — assert presence/absence instead (`expect(wrapper.find('.foo').exists()).toBe(false)`)
- `getComputedStyle` assertions on design tokens (color, padding, `flex-direction`)
- real event dispatch — `trigger()` simulates events
- canvas (ECharts), `ResizeObserver`, `IntersectionObserver` — stub the component that needs them

`happy-dom` also **lacks some browser APIs entirely**. `EventSource` is one: mounting a component that opens an SSE subscription throws `ReferenceError: EventSource is not defined`. It surfaces as an _unhandled rejection_, so Vitest **exits non-zero while reporting every test as passed** — do not read a green test list as success. Mock the subscribing module ([Mocking dependencies](./mocking.md)) so the subscription is never opened.

Never claim a component is untestable because there is no browser: its behaviour is testable here, only its appearance is not.

### Styling and visual non-regression (planned)

Appearance will be covered by a separate `visual` project, not by unit tests: Vitest browser mode with Playwright, `*.visual.test.ts` files mounting each variant and state of a component in light and dark, `expect.element(…).toMatchScreenshot()` against committed baselines, run by a `test:visual` script outside `yarn test`. Until it exists, a unit test never asserts a style, and a component's variant matrix is covered through its classes.
