# Assert behavior, not implementation

**This is the rule the rest of the guide serves**, in `@xen-orchestra/web-core` and `@xen-orchestra/web` alike. A test earns its place by failing when behavior breaks, and staying green through any refactor that preserves it.

- Assert concrete outputs and contracts (`input → output`). Never assert _how_ the result was reached — which helper ran, in which order, how many times.
- Every test must assert something meaningful. Never re-assert a mock's own return value: `getItemById.mockReturnValue(item)` followed by `expect(…).toBe(item)` tests the mock, not the code.
- **When a value is produced by a helper, build the expected value with that same helper** instead of copying its output as a literal. `objectIcon(type, state)` owns the icon-name format and `t(key)` owns the wording of a translation; what the code under test decides is _which_ icon and _which_ key. Assert that decision:

```typescript
// ✗ pins a format the code under test does not own — renaming the icon scheme or rewording a
//   translation then breaks the test even though the behavior is unchanged
expect(wrapper.vm.icon).toBe('object:vm:running')
expect(wrapper.vm.label).toBe('Enabled')

// ✓ asserts the decision: the running icon, the enabled label
expect(wrapper.vm.icon).toBe(objectIcon('vm', 'running'))
expect(wrapper.vm.label).toBe(t('enabled'))
```

- A component test takes that `t` from the very instance its mount installs: `t` of `@core-test/i18n.ts` in web-core (XO 6: see [Translations](../../../web/docs/tests/testing-components.md#translations)); a composable test calls `useI18n()` inside the `setup` callback (see [Testing composables](./testing-composables.md)).
- This is not tautological, because the helper is not the code under test: `objectIcon` and the translation files have their own tests. A test _of_ `objectIcon` does assert literals — that is where its format is pinned, once.
- Values that are literals in production stay literals in the test. `statusIcon` is written as `'status:running-circle'` in the source, so `expect(wrapper.vm.statusIcon).toBe('status:running-circle')` is the right assertion; there is no helper to defer to.
- Environment-dependent values — a relative timestamp, a formatted date — are derived the way production derives them (`formatDateTime` from `@core/utils/time.util.ts`), and the test says so.
- Every mock couples the test to the mocked surface, which is why the boundary stays tight — see [Mocking dependencies](./mocking.md).
- Test each behaviour in the package that owns it: what a web-core component, composable or store does on its own is tested in web-core, never from an XO 6 test — see [Which package tests what](../tests.md#which-package-tests-what).
