/* eslint-env jest */

import { debounceWithKey, REMOVE_CACHE_ENTRY } from './_pDebounceWithKey.mjs'

describe('REMOVE_CACHE_ENTRY', () => {
  it('clears the cache', async () => {
    let i = 0
    const debouncedFn = debounceWithKey(
      function () {
        return Promise.resolve(++i)
      },
      Infinity,
      id => id
    )

    // not cached accross keys
    expect(await debouncedFn(1)).toBe(1)
    expect(await debouncedFn(2)).toBe(2)

    // retrieve the already cached values
    expect(await debouncedFn(1)).toBe(1)
    expect(await debouncedFn(2)).toBe(2)

    // an entry for a specific key can be removed
    debouncedFn(REMOVE_CACHE_ENTRY, 1)
    expect(await debouncedFn(1)).toBe(3)
    expect(await debouncedFn(2)).toBe(2)
  })
})
