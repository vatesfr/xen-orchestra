# Testing components

Components run in the same `unit` project as everything else: `@vue/test-utils` `mount` on `happy-dom`, **no browser needed**. Mount with `createGlobalTestConfig()` so the real `vue-i18n` instance and a fresh Pinia are installed, and give the repeated mount a helper (see [Setup](./setup-helpers.md)):

```typescript
import VmSystemGraphics from '@/modules/vm/components/system/VmSystemGraphics.vue'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'

function mountGraphics(vm = createVm()) {
  return mount(VmSystemGraphics, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

it('shows VGA as enabled when the VM uses the "std" adapter', () => {
  const wrapper = mountGraphics(createVm({ vga: 'std' }))

  expect(wrapper.text()).toContain('Enabled')
})
```

The test file sits next to the component, named `<ComponentName>.unit.test.ts` (no `.vue`). Group with `describe` only when the component has several distinct behaviours to separate; a small component reads better as flat `it`s.

## Keep components thin

A component should not carry much complex logic. Non-trivial computation (chart series, aggregation, formatting rules) belongs in a `*.util.ts` or a composable, tested directly — that is cheaper and covers more branches than mounting. A component that is awkward to test is telling you to **extract**, not to write a heavier component test, and never to skip the test.

What is left to assert at the component level is what it renders: labels, formatted values, conditional rows, empty states.

### Extracting from a tested component

The extraction is a refactor, so the tests come **first** and are what proves it changed nothing:

1. Write the tests against the component **as it stands**, and run them green.
2. Extract.
3. Re-run those tests **unchanged**.
4. Move the ones the extraction made redundant down next to the new util/composable, and delete them from the component test.

Step 3 is the gate. A test that has to be edited to pass is reporting a behaviour change — say so, do not absorb it into the diff. Tests written only _after_ an extraction describe the new code and cannot catch what the extraction broke, which is the whole risk being taken.

Step 4 is selective. A test that only exercised the logic now living in the util moves; a test asserting something the component alone does — rendering, conditional rows, empty states, feeding the util's output into the template — stays.

## Assert what the user reads, not the markup

`wrapper.text()` concatenates the whole subtree **with no separators**, so `'8 B'` and `'Disabled'` run together. It is fine for `toContain` on a single component, but it cannot express "this label has this value". Query instead:

```typescript
// every card title, in order
expect(wrapper.findAll('.ui-title').map(title => title.text())).toEqual(['Graphics & Display'])

// a key/value row: the markup is semantic, so label and value are addressable
const rows = wrapper.findAll('.vts-tabular-key-value-row')
const labelledValues = Object.fromEntries(rows.map(row => [row.get('dt.label').text(), row.get('dd.value').text()]))

expect(labelledValues).toEqual({ VGA: 'Disabled', 'Video RAM': '8 B' })
```

Prefer this shape: one assertion covering every row a user sees, in their real translated wording, and it fails loudly when a value lands under the wrong label. Assert against **class names and semantic elements**, never a positional chain of child indexes.

`src/test/find-labelled-values.ts` does exactly that reduction, so a card test does not re-roll it:

| Helper                   | Reads                                                      |
| ------------------------ | ---------------------------------------------------------- |
| `findLabelledValues`     | every `VtsTabularKeyValueRow` / `VtsKeyValueRow` of a card |
| `findCardLabelledValues` | every `VtsCardRowKeyValue` of a side-panel card            |

```typescript
expect(findLabelledValues(wrapper)).toEqual({ VGA: 'Disabled', 'Video RAM': '8 B' })
```

Both collapse rows that share a label into one entry — a list repeating the same label (an address list labelling only its first row) is queried directly instead:

```typescript
expect(wrapper.findAll('.vts-card-row-key-value').map(row => row.get('.value').text())).toEqual([
  '10.0.0.1',
  '10.0.0.2',
])
```

When a card mixes deterministic values with environment-derived ones (a relative start time, a locale-formatted date), pin the deterministic rows with `toMatchObject` and cover the composition separately by asserting the **list of labels, in order** — the formatted values themselves belong in the test of the composable that derives them.

## Routing

`createGlobalTestConfig()` installs a router on **every** mount, built by `src/test/create-test-router.ts` over the **real generated routes** on an in-memory history. Two unrelated things need it:

- A component rendering `RouterLink`. Without a router the link resolves to a plain element and its scoped slot (`isActive`, `href`) is never invoked, so the markup renders **empty instead of failing** — a tab bar silently becomes no tabs, and an assertion on it passes vacuously.
- Anything reaching `useUiStore` (`VtsStateHero`, `VtsKeyValueRow`, `TabItem`…). That store calls `useRouter()`/`useRoute()` in its setup, so a router-less mount logs two `injection "Symbol(router)" not found` warnings, and reading `uiStore.hasUi` would throw on `route.query`.

Because the routes are the real ones, `href` assertions are real paths (`/vm/vm-42/system`) rather than a stub's echo of its own prop. Page components are swapped for an empty one: a test never renders a page, and installing a router runs an initial navigation that would otherwise import the whole page module graph.

A test that needs to navigate builds its own router and pushes before mounting:

```typescript
const router = createTestRouter()
await router.push('/vm/vm-42/system')

const wrapper = mount(VmHeader, { props: { vm }, global: createGlobalTestConfig({ router }) })

expect(
  wrapper
    .findAll('.tab-item')
    .filter(tab => tab.classes('active'))
    .map(tab => tab.text())
).toEqual(['System'])
```

Pushing before mounting is what makes the active tab assertable; without a push the router sits at its start location and nothing is active.

## What `happy-dom` cannot do

There is no layout engine, and Vitest's `css` option is off, so component styles are never loaded. Out of reach:

- `toBeVisible()` and anything depending on real visibility — assert presence/absence instead (`expect(wrapper.find('.foo').exists()).toBe(false)`)
- `getComputedStyle` assertions on design tokens (colour, padding, `flex-direction`)
- real event dispatch — `trigger()` simulates events
- canvas (ECharts), `ResizeObserver`, `IntersectionObserver`

`happy-dom` also **lacks some browser APIs entirely**. `EventSource` is one: mounting a component that reaches a remote-resource collection opens an SSE subscription and throws `ReferenceError: EventSource is not defined`. It surfaces as an _unhandled rejection_, so Vitest **exits non-zero while reporting every test as passed** — do not read a green test list as success. Mock the collection ([Mocking dependencies](./mocking.md)) so the subscription is never opened.

## Pages

Pages (`src/pages/**`) are the **lowest** testing priority, and their tests stay thin. A page is composition: assert which components it renders, and their order. **Never assert a child's values from a page test** — duplicating them there adds no coverage, breaks on every unrelated child edit, and does not say which child broke. Value and formatting assertions live in the test next to the component that renders them.
