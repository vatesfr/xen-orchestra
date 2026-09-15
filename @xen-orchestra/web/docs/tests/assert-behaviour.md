# Assert behaviour, not implementation

**This is the rule the rest of the guide serves.** A test earns its place by failing when behaviour breaks, and staying green through any refactor that preserves it.

- Assert concrete outputs and contracts (`input → output`). Never assert _how_ the result was reached — which helper ran, in which order, how many times.
- Every test must assert something meaningful. Never re-assert a mock's own return value: `getHostById.mockReturnValue(host)` followed by `expect(…).toBe(host)` tests the mock, not the code.
- **When a value is produced by a helper, build the expected value with that same helper** instead of copying its output as a literal. `objectIcon(type, state)` owns the icon-name format and `t(key)` owns the wording of a translation; what the code under test decides is _which_ icon and _which_ key. Assert that decision:

```typescript
// ✗ pins a format the code under test does not own — renaming the icon scheme or rewording a
//   translation then breaks the test even though the behaviour is unchanged
expect(displayData.vmIcon).toBe('object:vm:running')
expect(wrapper.vm.powerState.text).toBe('Running')

// ✓ asserts the decision: the running VM icon, the running status label
expect(displayData.vmIcon).toBe(objectIcon('vm', 'running'))
expect(wrapper.vm.powerState.text).toBe(t('vm:status:running'))
```

- A component test takes that `t` — and the `d` for a locale-formatted date — from `src/test/i18n.ts`, the very instance `createGlobalTestConfig()` installs; a composable test calls `useI18n()` inside the `setup` callback (see [Testing composables](./testing-composables.md)).
- This is not tautological, because the helper is not the code under test: `objectIcon` and the translation files have their own tests. A test _of_ `objectIcon` does assert literals — that is where its format is pinned, once.
- Values that are literals in production stay literals in the test. `powerState.icon` is written as `'status:running-circle'` in the source, so `expect(wrapper.vm.powerState.icon).toBe('status:running-circle')` is the right assertion; there is no helper to defer to.
- Environment-dependent values — a relative timestamp, a locale-formatted date — are derived the way production derives them, and the test says so.
- Every mock couples the test to the mocked surface, which is why the boundary stays tight — see [Mocking dependencies](./mocking.md).
