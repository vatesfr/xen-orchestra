/**
 * Resets the `vi.fn()` stubs of a test file, skipping any other value (a ref, a plain value): pass them one by one, or
 * spread the values of a mock record. Never `vi.resetAllMocks()`: it would also put the modules mocked with
 * `mockModule` back on their real exports.
 */
export function resetStubs(...values: unknown[]) {
  for (const value of values) {
    if (vi.isMockFunction(value)) {
      value.mockReset()
    }
  }
}
