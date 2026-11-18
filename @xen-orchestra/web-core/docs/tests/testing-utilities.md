# Testing pure utilities

Utility functions (`*.util.ts`) are pure — import and call them directly, and assert `input → output`. No mounting, no mocks.

```typescript
describe('toVariants', () => {
  it('renders a `true` value as the bare key', () => {
    expect(toVariants({ disabled: true })).toEqual(['disabled'])
  })

  it('drops falsy values', () => {
    expect(toVariants({ accent: undefined, disabled: false, size: '' })).toEqual([])
  })
})
```

Cover the meaningful edge cases: empty input, missing samples (`NaN` propagation), `null` data, and boundary rounding.

> **Prefer extracting pure logic into a util.** When a `<script setup>` holds non-trivial logic (series, formatting, aggregation), pull it into a `*.util.ts` and unit-test that — a component should not carry much complex logic. What remains in the component is then rendering, covered by [Testing components](./testing-components.md).

> **A util more than one consumer needs lives once.** Generic logic belongs in `web-core/lib/utils/` (or a shared `@vates/*` package), tested there; an app or a module never forks it. Where XO 6 keeps its own shared utils, see [XO 6 utilities](../../../web/docs/tests/testing-utilities.md).
