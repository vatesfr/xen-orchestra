# Testing components

Components run in the same `unit` project as everything else: `@vue/test-utils` `mount` on `happy-dom`, **no browser needed**. Mount with `createGlobalTestConfig()` so the real `vue-i18n` instance and a fresh Pinia are installed, and give the repeated mount a helper (see [Setup](./setup-helpers.md)):

```typescript
import VmSystemGraphics from '@/modules/vm/components/system/VmSystemGraphics.vue'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountGraphics(vm = createVm()) {
  return mount(VmSystemGraphics, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

it('shows VGA as enabled when the VM uses the "std" adapter', () => {
  const wrapper = mountGraphics(createVm({ vga: 'std' }))

  expect(wrapper.text()).toContain(t('enabled'))
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
expect(wrapper.findAll('.ui-title').map(title => title.text())).toEqual([t('graphics-display')])

// a key/value row: the markup is semantic, so label and value are addressable
const rows = wrapper.findAll('.vts-tabular-key-value-row')
const labelledValues = Object.fromEntries(rows.map(row => [row.get('dt.label').text(), row.get('dd.value').text()]))

expect(labelledValues).toEqual({ [t('vga')]: t('disabled'), [t('video-ram')]: '8 B' })
```

Prefer this shape: one assertion covering every row a user sees, and it fails loudly when a value lands under the wrong label. Assert against **class names and semantic elements**, never a positional chain of child indexes.

`src/test/find-labelled-values.ts` does exactly that reduction, so a card test does not re-roll it:

| Helper                   | Reads                                                           |
| ------------------------ | --------------------------------------------------------------- |
| `findLabelledValues`     | every `VtsTabularKeyValueRow` / `VtsKeyValueRow` of a card      |
| `findLabelledLinks`      | the same rows, as `{ label: href }`, skipping the unlinked ones |
| `findCardLabelledValues` | every `VtsCardRowKeyValue` of a side-panel card                 |
| `findCardLabels`         | the label of every `VtsCardRowKeyValue`, in order               |
| `findCardLabelledList`   | the values a card lists under one label (see below)             |
| `findCardValue`          | one row's value element, by label, to query inside it           |
| `findLegends`            | every `UiLegend` of a donut or progress-bar card (see below)    |
| `findLegendSections`     | the same, grouped per titled donut (see below)                  |
| `findCardNumbers`        | every `UiCardNumbers` a dashboard card lays out                 |

`src/test/find-card-heading.ts` reads what a `UiCardTitle` lays out — its `title`, the `info` beside it and the `description` under it, each left out when the card does not fill that slot, so one assertion covers the whole heading:

```typescript
expect(findCardHeading(wrapper)).toEqual({ title: t('pools-status'), info: t('action:see-all') })
```

`src/test/find-tags.ts` reads the `VtsTag`s a card lists, as `findTagLabels(wrapper)` — an empty array when the object carries no tag.

```typescript
expect(findLabelledValues(wrapper)).toEqual({ [t('vga')]: t('disabled'), [t('video-ram')]: '8 B' })
```

The first three collapse rows that share a label into one entry, so a **list** — whose rows label only the first — is read with `findCardLabelledList` instead:

```typescript
expect(findCardLabelledList(wrapper, t('ip-addresses'))).toEqual(['10.0.0.1', '10.0.0.2'])
```

It stops at the next labelled row, so a card laying out several lists (a PIF side panel lists its addresses, then its bonded devices) reads each one on its own. `findCardLabels` covers the complementary assertion — that a row is _there_, and where — which the collapsed record cannot express.

When a card mixes deterministic values with environment-derived ones (a relative start time, a locale-formatted date), pin the deterministic rows with `toMatchObject` and cover the composition separately by asserting the **list of labels, in order** — the formatted values themselves belong in the test of the composable that derives them.

### Never spell out a translation

A rendered label or a translated value is wording the component does not own, so [asserting behaviour](./assert-behaviour.md) means naming the **key**, not the English string. `src/test/i18n.ts` exposes the `t` and `d` of the very instance `createGlobalTestConfig()` installs:

```typescript
// ✗ rewording the translation breaks the test although the component still picks the same key
expect(findLabelledValues(wrapper)).toEqual({ 'Suspend storage repository': 'None' })

// ✓ asserts the decision: the suspend-SR row, falling back to the "none" wording
expect(findLabelledValues(wrapper)).toEqual({ [t('suspend-storage-repository')]: t('none') })
```

A mistyped key does not pass quietly — `t` returns a `⟨key⟩` marker for a key the locale has no entry for, which matches no rendered text.

A row rendering a `VtsRelativeTime` is worded relative to _now_ and locale-formatted, so neither end of the comparison can be a literal. `src/test/i18n.ts` builds the expected wording the way the component does, with `relativeTime(date)` — pass the date in **milliseconds**, the way the component does after scaling the seconds a host reports:

```typescript
const startTimeInSeconds = 1660000000

expect(findLabelledValues(wrapper)).toMatchObject({
  [t('started')]: relativeTime(startTimeInSeconds * 1000),
})
```

Where the line falls:

| Value                                                      | Assert as                                          |
| ---------------------------------------------------------- | -------------------------------------------------- |
| a label, or a value that is itself a translation           | `t('key')` — including a plural, `t('n-vcpus', 2)` |
| a locale-formatted date                                    | `d(timestamp, { …the component's options })`       |
| a string the component composes from several translations  | a template literal of those `t(…)` calls           |
| data reaching the component (a name, an id, an IP, a tag)  | the literal — it is the test's own input           |
| a number the component formats (`'8 B'`, `'4 GiB'`, `'2'`) | the literal — deriving it would copy the template  |

## Tables

A table is read by column **label**, never by counting `td`s, with `src/test/find-table-rows.ts`:

| Helper          | Reads                                                       |
| --------------- | ----------------------------------------------------------- |
| `findTableRows` | every body row as a `{ column label: value }` record        |
| `findTableCell` | one cell, by row index and column label, to query inside it |

```typescript
expect(findTableRows(wrapper)).toEqual([
  {
    [t('network')]: 'Management network',
    [t('device')]: 'eth0',
    [t('status')]: t('connected'),
    '': '', // the actions column carries no label
  },
])
```

One assertion covers a whole row and fails loudly when a value lands under the wrong column. Columns sharing a label — the unlabelled ones — collapse into one entry, so an actions or select column is reached with `findTableCell`, which is also how a test gets _inside_ a cell:

```typescript
const cell = findTableCell(wrapper, { row: 0, column: t('ip-address') })

await cell.get('.more').trigger('click') // a `VtsCollapsedListCell` shows only its first item until expanded

expect(cell.findAll('li').map(item => item.text())).toEqual(['10.0.0.1', '2001:db8::1'])
```

## Chart cards

A dashboard chart card loads its `VtsLinearChart` asynchronously, and the real chart cannot mount here: ECharts needs a canvas and a `ResizeObserver`. `src/test/linear-chart-stub.ts` stands in for it, with the props declared so they stay readable. `mountChartCard` from `src/test/mount-chart-card.ts` wires that stub in and defaults `loading` to `false`, so a card test only names its component and its stats type:

```typescript
function mountChart(props: ChartCardProps<XapiHostStats>) {
  return mountChartCard(HostDashboardLoadAverageChart, props)
}

it('plots the load average of the host', () => {
  const wrapper = mountChart({ data: createHostStats({ stats: { load: [1.234, 2.567] } }) })

  expect(findLinearChart(wrapper).props('data')).toEqual([
    {
      label: t('load-average'),
      data: [
        { timestamp: 990_000, value: 1.23 },
        { timestamp: 1_000_000, value: 2.57 },
      ],
    },
  ])
})
```

Stubbing with `true` instead would push the props into attributes, where they arrive stringified — which is why `mountChartCard` owns that wiring rather than each test repeating it.

Assert the plotted series, not the absence of a state hero. Every card guards on the series it built, so an empty series does reach the "no data" hero — but a hero-only test still passes over a series plotting the wrong samples. That is how the pool CPU card came to size its series off `stats.memory` unnoticed.

The `maxValue` is worth its own assertion: it is where the card's own axis choice lives (`{ step: 5, fallback: 10 }` for the host load average, `step: 50` for host network throughput, `headroom: 1.2` for the stacked pool cpu usage), and nothing else covers it.

So is the `valueFormatter`, which decides whether the axis and the tooltips read `1 KiB` or `1024%`. `formatChartValue(wrapper, value)` runs a value through the formatter the card handed over, and returns `undefined` when it handed none — so one assertion covers both the choice of formatter and the wiring:

```typescript
it('formats the plotted values as bytes', () => {
  const wrapper = mountChart({ data: statsWithSamples })

  expect(formatChartValue(wrapper, 1024)).toBe('1 KiB')
})
```

Keep it to one representative value: how the formatter handles the whole range, `null` included, belongs to the formatter's own test — `chart-stats.util.unit.test.ts` for `formatChartBytes`, `chart-percent-formatter.composable.unit.test.ts` for `useChartPercentFormatter`.

## Legend cards

A donut card and a progress-bar card both render their values through `UiLegend`, which keeps the label and the value addressable:

```typescript
expect(findLegends(wrapper)).toEqual([
  [t('vm:status:running', 2), '2'],
  [t('vm:status:halted', 2), '1'],
])
```

Three things shape those assertions:

- `VtsProgressBarGroup` sorts **descending by default**, so the expected order is the busiest first, not the order the payload listed.
- A card holding several **titled** donuts — `PoolDashboardStatus` shows one for its hosts and one for its VMs, `SiteDashboardPatches` one for its pools and one for its hosts — reads with `findLegendSections`, which returns `[title, legends]` per donut. `findLegends` collapses them into one flat list, and an assertion on it no longer says which breakdown a value landed in.

```typescript
expect(findLegendSections(wrapper)).toEqual([
  [
    t('pools'),
    [
      [t('up-to-date'), '6'],
      [t('missing-patches'), '4'],
    ],
  ],
  [
    t('hosts'),
    [
      [t('up-to-date'), '12'],
      [t('missing-patches'), '8'],
      [t('eol'), '3'],
    ],
  ],
])
```

- `VtsStateHero` renders its own wording ahead of the slot: an `all-done` hero reads `'All good!Patches up to date'`. Assert the part the component owns with `toContain`.

## Routing

`createGlobalTestConfig()` installs a router on **every** mount, built by `src/test/create-test-router.ts` over the **real generated routes** on an in-memory history. Two unrelated things need it:

- A component rendering `RouterLink`. Without a router the link resolves to a plain element and its scoped slot (`isActive`, `href`) is never invoked, so the markup renders **empty instead of failing** — a tab bar silently becomes no tabs, and an assertion on it passes vacuously.
- Anything reaching `useUiStore` (`VtsStateHero`, `VtsKeyValueRow`, `TabItem`…). That store calls `useRouter()`/`useRoute()` in its setup, so a router-less mount logs two `injection "Symbol(router)" not found` warnings, and reading `uiStore.hasUi` would throw on `route.query`.

Because the routes are the real ones, `href` assertions are real paths (`/vm/vm-42/system`) rather than a stub's echo of its own prop. Page components are swapped for an empty one: a test never renders a page, and installing a router runs an initial navigation that would otherwise import the whole page module graph.

A test that needs to navigate mounts on a router already pushed to that path, with `createGlobalTestConfigAt`:

```typescript
const wrapper = mount(VmHeader, { props: { vm }, global: await createGlobalTestConfigAt('/vm/vm-42/system') })

expect(findActiveTabLabels(wrapper)).toEqual([t('system')])
```

Pushing before mounting is what makes the active tab assertable; without a push the router sits at its start location and nothing is active.

Every header renders the same tab bar, so `src/test/find-tabs.ts` reads it instead of each header test re-rolling the queries:

| Helper                | Reads                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------- |
| `findTabLabels`       | the label of every tab, in order                                                       |
| `findInAppTabHrefs`   | the href of the tabs navigating inside XO 6                                            |
| `findActiveTabLabels` | the label of the tabs marked active                                                    |
| `findTab`             | one tab by its label — reaches a tab whose link leaves for XO 5, which the others skip |

The head bar above it is shared the same way, by `src/test/find-head-bar.ts`:

| Helper                        | Reads                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `findHeadBarLabel`            | the name of the object the header is about                                   |
| `findHeadBarIconPaths`        | the object icon, to compare with `findObjectIconPaths` (see below)           |
| `isHeadBarIconBusy`           | whether the icon was replaced by a loader, i.e. the object is changing state |
| `findHeadBarActionLink`       | the first action offered as a link rather than as a menu                     |
| `findHeadBarActionsText`      | every action, as the text a user reads                                       |
| `hasHeadBarMoreActionsButton` | whether the more-actions menu is offered                                     |
| `hasHeadBarStatus`            | whether the status slot renders, i.e. the object leads its pool              |

### Naming the icon a component picked

An icon renders as bare `<svg>` paths, so the only way to name the one a component picked is to compare it with a reference render of the icon it was meant to pick — the rendering counterpart of asserting `objectIcon(…)`, which [cannot fail](./assert-behaviour.md). `src/test/find-icon-paths.ts` does both halves:

```typescript
expect(findHeadBarIconPaths(wrapper)).toEqual(findObjectIconPaths('host', 'halted'))
expect(findHeadBarIconPaths(wrapper)).not.toEqual(findObjectIconPaths('host', 'running'))
```

The negative assertion matters: two states rendering the same paths would let the positive one pass on a broken mapping.

`findNamedIconPaths` is the same reference render for an icon a component picks **by name** rather than from an object and its state — a status marker on a row, an action glyph. Scope the read to the element the icon belongs to, or the addons beside it (a copy button) are counted too:

```typescript
expect(findIconPaths(findCardValue(wrapper, t('device')))).toEqual(findNamedIconPaths('status:primary-circle'))
expect(findIconPaths(findCardValue(wrapper, t('device')))).toEqual([]) // an unmarked row
```

## What `happy-dom` cannot do

There is no layout engine, and Vitest's `css` option is off, so component styles are never loaded. Out of reach:

- `toBeVisible()` and anything depending on real visibility — assert presence/absence instead (`expect(wrapper.find('.foo').exists()).toBe(false)`)
- `getComputedStyle` assertions on design tokens (colour, padding, `flex-direction`)
- real event dispatch — `trigger()` simulates events
- canvas (ECharts), `ResizeObserver`, `IntersectionObserver` — for a chart card, stub the chart (see [Chart cards](#chart-cards))

`happy-dom` also **lacks some browser APIs entirely**. `EventSource` is one: mounting a component that reaches a remote-resource collection opens an SSE subscription and throws `ReferenceError: EventSource is not defined`. It surfaces as an _unhandled rejection_, so Vitest **exits non-zero while reporting every test as passed** — do not read a green test list as success. Mock the collection ([Mocking dependencies](./mocking.md)) so the subscription is never opened.

## Pages

Pages (`src/pages/**`) are the **lowest** testing priority, and their tests stay thin. A page is composition: assert which components it renders, and their order. **Never assert a child's values from a page test** — duplicating them there adds no coverage, breaks on every unrelated child edit, and does not say which child broke. Value and formatting assertions live in the test next to the component that renders them.
