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

  await expect(debouncedFn(key)).resolves.toBe(1)
  await expect(debouncedFn(key)).resolves.toBe(1)

  await debouncedFn(REMOVE_CACHE_ENTRY, key)
  await expect(debouncedFn(key)).resolves.toBe(2)
})
