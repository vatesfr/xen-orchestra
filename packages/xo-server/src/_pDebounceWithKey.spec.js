/* eslint-env jest */

import { debounceWithKey, REMOVE_CACHE_ENTRY } from './_pDebounceWithKey'

test('clear the cache of debounced function', async () => {
  const key = 2

  let i = 0
  const debouncedFn = debounceWithKey(
    function() {
      return Promise.resolve(++i)
    },
    120e3,
    id => id
  )

  expect(await debouncedFn(key)).toBe(1)
  expect(await debouncedFn(key)).toBe(1)

  debouncedFn(REMOVE_CACHE_ENTRY, key)
  expect(await debouncedFn(key)).toBe(2)
})
