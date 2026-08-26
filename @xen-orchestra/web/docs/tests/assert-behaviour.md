# Assert behaviour, not implementation

**This is the rule the rest of the guide serves.** A test earns its place by failing when behaviour breaks, and staying green through any refactor that preserves it.

- Assert concrete outputs and contracts (`input → output`). Never assert _how_ the result was reached — which helper ran, in which order, how many times.
- Every test must assert something meaningful. Never re-assert a mock's own return value: `getHostById.mockReturnValue(host)` followed by `expect(…).toBe(host)` tests the mock, not the code.
- **Write the expected value as a literal.** Never compute it by calling the same production code the assertion is checking — that assertion cannot fail. Icon names are the usual temptation, because `icon()` is `return name` and `objectIcon(type, state)` is `` `object:${type}:${state}` ``, so re-deriving them asserts nothing:

```typescript
// ✗ tautological: if the icon-name format changes, both sides change together and the test stays green
expect(displayData.vmIcon).toBe(objectIcon('vm', 'running'))

// ✓ the icon name is part of the contract, so pin it
expect(displayData.vmIcon).toBe('object:vm:running')
expect(wrapper.vm.powerState.icon).toBe('status:running-circle')
```

- Same rule, same reason: assert the **translated string a user reads** (`'Running'`, `'Not running'`, `'Unknown'`), never the i18n key or `t('…')` behind it.
- The exception is a value that genuinely varies with the environment — a relative timestamp, a locale-formatted date. There, derive the expected value the way production does, and say so in the test.
- Every mock couples the test to the mocked surface, which is why the boundary stays tight — see [Mocking dependencies](./mocking.md).
