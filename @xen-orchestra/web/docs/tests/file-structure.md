# File layout and structure

## File layout and naming

- A test file lives **next to** the file it covers, named `<source-name>.unit.test.ts`.
  - `xo-host.util.ts` → `xo-host.util.unit.test.ts`
  - `use-pool-enhanced-data.composable.ts` → `use-pool-enhanced-data.composable.unit.test.ts`
  - `VmSystemGraphics.vue` → `VmSystemGraphics.unit.test.ts` (the `.vue` is dropped)
- Shared test data **factories** and helpers live in `src/test/`.

## Structuring a test file

- **One `describe` block per function or exposed property**, labelled with its exact name (`describe('getHostInfo')`, `describe('powerState')`). A component test has no such members: group with `describe` only to separate genuinely distinct behaviours, otherwise flat `it`s read better.
- Use `it` (not `test`).
- The name completes the sentence the `it` starts: a **present-tense assertion**, lowercase, no trailing period, and **without a redundant prefix** — the `describe` label already carries the function name. `it('formats the core count with its socket count')` reads as one sentence; `it('getHostCoreSocketInfo formats …')` stutters.

```typescript
describe('getHostCoreSocketInfo', () => {
  it('formats the core count with its socket count', () => {
    const host = createHost({ cpus: { cores: 8, sockets: 2 } })

    expect(getHostCoreSocketInfo(host)).toBe('8 (2)')
  })

  it('falls back to zero for missing core and socket counts', () => {
    const host = createHost({ cpus: {} })

    expect(getHostCoreSocketInfo(host)).toBe('0 (0)')
  })
})
```

## Do not import from `vitest`

`globals: true` (in `vite.config.ts`) together with `"types": ["vitest/globals"]` (in `tsconfig.app.json`) make `describe`, `it`, `expect`, `vi` and `beforeEach` available globally. **Never** add `import { ... } from 'vitest'`.
