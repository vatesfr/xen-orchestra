# Components (XO 6)

The shared rules — keep components thin, extract under unchanged tests, assert what the user reads, never spell out a translation, what `happy-dom` cannot do — are in [Testing components](../../../web-core/docs/tests/testing-components.md). In XO 6, mount with `createGlobalTestConfig()` so the real `vue-i18n` instance, the app form validation messages (`RegleVuePlugin` with `formValidationConfig`, as in `main.ts`) and a fresh Pinia are installed:

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

## Reading rendered values

A label/value row is read through one query covering every row a user sees ([Assert what the user reads](../../../web-core/docs/tests/testing-components.md#assert-what-the-user-reads-not-the-markup)). `src/test/find-rendered-values.ts` does that reduction, so a card test does not re-roll it:

| Helper                       | Reads                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `findLabelledValues`         | every `VtsTabularKeyValueRow` / `VtsKeyValueRow` of a card                   |
| `findCardLabelledValues`     | every `VtsCardRowKeyValue` of a side-panel card                              |
| `findCardLabelledValueLists` | every `VtsCardRowKeyValue`, each value of a multi-value row listed           |
| `findRowLabels`              | the label of every `VtsTabularKeyValueRow` / `VtsKeyValueRow`                |
| `findCardRowLabels`          | the label of every `VtsCardRowKeyValue`, in order                            |
| `findCardRows`               | every `VtsCardRowKeyValue` as `[label, value]` pairs, in order               |
| `hasCardRowCopy`             | whether the `VtsCardRowKeyValue` with that label offers a copy               |
| `findCardRowLink`            | the link of the `VtsCardRowKeyValue` with that label, as `findLink` reads it |
| `findCardRowElements`        | every `VtsCardRowKeyValue` as its key and value elements                     |
| `findCardRowLinks`           | every link of the `VtsCardRowKeyValue` rows, as `[text, href]`               |
| `findCopiedValues`           | what each copyable key/value row copies, keyed by label                      |
| `findCardCopiedValues`       | what each copyable `VtsCardRowKeyValue` copies, in order                     |

```typescript
expect(findLabelledValues(wrapper)).toEqual({ [t('vga')]: t('disabled'), [t('video-ram')]: '8 B' })
```

A row offers a copy button through its `copy` prop (copies its `value`) or its `copy-value` prop (copies that string). `findCopiedValues` leaves rows without one out, so a `toEqual` pins both which rows are copyable and what they copy — including a row that must offer no copy because its value is empty:

```typescript
expect(findCopiedValues(wrapper)).toEqual({ [t('ip-address')]: '10.0.0.1', [t('uuid')]: 'vm-42' })
```

`findCardRows` keeps rows sharing a label (one row per VM, labelled on the first one only), which `findCardLabelledValues` would collapse. A check on the row elements themselves (whether a button sits inside a row) uses the exported `CARD_KEY_VALUE_ROW_SELECTOR`, never the raw class.

Both read one value per row. A `VtsCardRowKeyValue` given several `values` (an address list, report recipients) renders them all under a single label, so read it with `findCardLabelledValueLists` instead:

```typescript
expect(findCardLabelledValueLists(wrapper)).toEqual({ [t('ip-addresses')]: ['10.0.0.1', '10.0.0.2'] })
```

When a card mixes deterministic values with environment-derived ones (a relative start time, a formatted date), pin the deterministic rows with `toMatchObject` and cover the composition separately by asserting the **list of labels, in order** — the formatted values themselves belong in the test of the composable that derives them.

Two more readers live in the same file, for output that is not a label/value pair:

| Helper          | Reads                                                             |
| --------------- | ----------------------------------------------------------------- |
| `findTableRows` | the `tbody` of a table, as one array of **cell** texts per row    |
| `findTags`      | every `UiTag`, as its text, in the order the component lists them |

```typescript
expect(findTableRows(wrapper)).toEqual([
  ['XSAPATCH-1', '1.0'],
  ['XSAPATCH-2', '2.0'],
])
```

`findTableRows` reads cells rather than each row's whole text for the same reason the helpers above split label from value: `row.text()` concatenates the columns, so a patch named `XSAPATCH-1` at version `1.0` and one named `XSAPATCH-11` at version `.0` read identically.

### Translations

`src/test/i18n.ts` exposes the `t` and `n` of the very instance `createGlobalTestConfig()` installs: import them to build an expected label (see [Never spell out a translation](../../../web-core/docs/tests/testing-components.md#never-spell-out-a-translation)).

## Tables

A table is read **by header label**, never by column position: `src/test/find-table-cells.ts` looks the label up in `thead th`, so a column added, moved or hidden does not shift the assertions.

| Helper                                                   | Reads                                                                 |
| -------------------------------------------------------- | --------------------------------------------------------------------- |
| `findTableHeaders(wrapper)`                              | the header labels, in order (`''` for a checkbox column)              |
| `findTableColumn(wrapper, label)`                        | the text of each cell of that column, one per body row                |
| `findTableColumnCells(wrapper, label)`                   | the cells of that column, to query a link, a tag or a checkbox inside |
| `findTableRows(wrapper)`, from `find-rendered-values.ts` | the cell texts of each body row, for a table read row by row          |

```typescript
expect(findTableHeaders(wrapper)).toEqual(['', t('vm'), t('size')])
expect(findTableColumn(wrapper, t('size'))).toEqual(['80GiB', '120GiB'])
expect(findLink(findTableColumnCells(wrapper, t('vm'))[0])?.href).toBe('/vm/vm-42/dashboard')
```

A label missing from the header throws, naming the label, rather than reading an empty column.

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

A donut card and a progress-bar card both render their values through `UiLegend`, which keeps the label and the value addressable. `src/test/find-rendered-values.ts` reads them, so a card test does not re-roll the query:

| Helper                        | Reads                                                  |
| ----------------------------- | ------------------------------------------------------ |
| `findLegends`                 | every `UiLegend`, as ordered `[label, value]` pairs    |
| `findProgressBarGroupLegends` | the same, grouped per `VtsProgressBarGroup`            |
| `findCardNumbers`             | every `UiCardNumbers` a card lays out beside its chart |

```typescript
expect(findLegends(wrapper)).toEqual([
  [t('vm:status:running', 2), '2'],
  [t('vm:status:halted', 2), '1'],
])
```

Pairs rather than a record: a card may legend the same label twice, and the order it lists them in is part of what a user reads.

Three things shape those assertions:

- `VtsProgressBarGroup` sorts **descending by default**, so the expected order is the busiest first, not the order the payload listed.
- A card holding several legend groups — `PoolDashboardStatus` shows one for its hosts and one for its VMs — is queried per group: `findProgressBarGroupLegends` does that for progress-bar groups, while a donut card goes through `wrapper.findAll('.vts-donut-chart-with-legend')` and the legends inside each. A flat `findLegends` collapses the groups into one list, and an assertion on it no longer says which group a value landed in.
- `VtsStateHero` renders its own wording ahead of the slot: an `all-done` hero reads `'All good!Patches up to date'`. Assert the part the component owns with `toContain`.

## Routing

`createGlobalTestConfig()` installs a router on **every** mount, built by `src/test/create-test-router.ts` over the **real generated routes** on an in-memory history. Two unrelated things need it:

- A component rendering `RouterLink`. Without a router the link resolves to a plain element and its scoped slot (`isActive`, `href`) is never invoked, so the markup renders **empty instead of failing** — a tab bar silently becomes no tabs, and an assertion on it passes vacuously.
- Anything reaching `useUiStore` (`VtsStateHero`, `VtsKeyValueRow`, `UiTabItem`…). That store calls `useRouter()`/`useRoute()` in its setup, so a router-less mount logs two `injection "Symbol(router)" not found` warnings, and reading `uiStore.hasUi` would throw on `route.query`.

Because the routes are the real ones, `href` assertions are real paths (`/vm/vm-42/system`) rather than a stub's echo of its own prop. Page components are swapped for an empty one: a test never renders a page, and installing a router runs an initial navigation that would otherwise import the whole page module graph.

A test that needs to navigate builds its own router and pushes before mounting:

```typescript
const router = createTestRouter()
await router.push('/vm/vm-42/system')

const wrapper = mount(VmHeader, { props: { vm }, global: createGlobalTestConfig({ router }) })

expect(
  wrapper
    .findAllComponents(UiTabItem)
    .filter(tab => tab.props('active'))
    .map(tab => tab.text())
).toEqual([t('system')])
```

Pushing before mounting is what makes the active tab assertable; without a push the router sits at its start location and nothing is active.

## Selects

How `VtsSelect` renders and opens its options belongs to the web-core tests, never to an XO 6 one; XO 6's `FormSelect` wraps it:

- A component that only passes select bindings on is mounted with `createGlobalTestConfig({ stubs: { FormSelect: true } })`, given `createSelectBindings`, and read with `findSelectStubLabels`.
- The options a form builds (their labels, their custom properties) are read by mounting the form with `mountWithSetup` (`mountWithSetupResult` when the test reads the form too; it takes the `createGlobalTestConfig` options, as `mountUnderNewVmForm` does), rendering its select with `renderSelect(id)` (`@core-test/mount-with-select.ts`), then `openSelect` and `findSelectOptionLabels` (`findDetailedOptions` for options showing an icon or details); `findShownSelections` reads the selection each select shows. Those readers live in web-core (`@core-test/select.ts`), beside the `mountWithSetup` (`@core-test/mount-with-setup.ts`) that XO 6's wraps.

## Remote-resource collections

A remote-resource collection opens an SSE subscription, which `happy-dom` cannot ([What `happy-dom` cannot do](../../../web-core/docs/tests/testing-components.md#what-happy-dom-cannot-do)): mock it with its `src/test/` module ([Mocking](./mocking.md)).

## Pages

Pages (`src/pages/**`) are the **lowest** testing priority, and their tests stay thin. A page is composition: assert which components it renders, and their order. **Never assert a child's values from a page test** — duplicating them there adds no coverage, breaks on every unrelated child edit, and does not say which child broke. Value and formatting assertions live in the test next to the component that renders them.
