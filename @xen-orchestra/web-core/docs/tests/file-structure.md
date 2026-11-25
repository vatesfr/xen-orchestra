# File layout and structure

## File layout and naming

- A test file lives **next to** the file it covers, named `<source-name>.unit.test.ts`.
  - `to-variants.util.ts` → `to-variants.util.unit.test.ts`
  - `menu-popup.composable.ts` → `menu-popup.composable.unit.test.ts`
  - `VtsSuccessStateHero.vue` → `VtsSuccessStateHero.unit.test.ts` (the `.vue` is dropped)
- Shared test infrastructure lives apart from the code: `test/` in web-core (alias `@core-test`), `src/test/` in XO 6 (alias `@/test`) — see [Shared test helpers](../tests.md#shared-test-helpers).

## Structuring a test file

- **One `describe` block per function or exposed property**, labeled with its exact name (`describe('formatItemCount')`, `describe('status')`). A component test has no such members: group with `describe` only to separate genuinely distinct behaviors, otherwise flat `it`s read better.
- Use `it` (not `test`).
- The name completes the sentence the `it` starts: a **present-tense assertion**, lowercase, no trailing period, and **without a redundant prefix** — the `describe` label already carries the function name. `it('formats the selected count with the total')` reads as one sentence; `it('formatItemCount formats …')` stutters. An `it.each` row label follows the same rule.

```typescript
describe('formatItemCount', () => {
  it.each([
    { label: 'formats the selected count with the total', counts: { selected: 2, total: 8 }, expected: '2 / 8' },
    { label: 'falls back to zero for missing counts', counts: {}, expected: '0 / 0' },
  ])('$label', ({ counts, expected }) => {
    expect(formatItemCount(counts)).toBe(expected)
  })
})
```

## Do not import from `vitest`

`globals: true` (in the package's `vitest.config.ts` / `vite.config.ts`) together with `"types": ["vitest/globals"]` make `describe`, `it`, `expect`, `vi` and `beforeEach` available globally. **Never** add `import { ... } from 'vitest'`.

Those types are declared in `tsconfig.vitest.json`, not in `tsconfig.app.json`, so they are ambient in test files only. A `expect()` left behind in production code is a type error rather than a runtime `ReferenceError` in the browser.

The two projects split on the file name:

| Project                | Covers                                                                                    | Test globals |
| ---------------------- | ----------------------------------------------------------------------------------------- | ------------ |
| `tsconfig.app.json`    | everything **except** `*.unit.test.ts` and the test infrastructure (`test/`, `src/test/`) | no           |
| `tsconfig.vitest.json` | everything, tests included; XO 6 also includes `web-core/test/` for `@core-test`          | yes          |
