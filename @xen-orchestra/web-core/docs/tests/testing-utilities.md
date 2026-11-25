# Testing pure utilities

Utility functions (`*.util.ts`) are pure — import and call them directly, and assert `input → output`. No mounting, no mocks.

```typescript
describe('toVariants', () => {
  it.each([
    { label: 'renders a `true` value as the bare key', variants: { disabled: true }, expected: ['disabled'] },
    { label: 'drops falsy values', variants: { accent: undefined, disabled: false, size: '' }, expected: [] },
  ])('$label', ({ variants, expected }) => {
    expect(toVariants(variants)).toEqual(expected)
  })
})
```

Cover the meaningful edge cases: empty input, missing samples (`NaN` propagation), `null` data, and boundary rounding.

> **Logic extracted from a component is tested here**, not through the component — see [Keep components thin](./testing-components.md#keep-components-thin).

> **A util more than one consumer needs lives once.** Generic logic belongs in `web-core/lib/utils/` (or a shared `@vates/*` package), tested there; an app or a module never forks it. Where XO 6 keeps its own shared utils, see [XO 6 utilities](../../../web/docs/tests/testing-utilities.md).
