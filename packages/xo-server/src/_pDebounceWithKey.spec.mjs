import assert from 'assert/strict'
import tap from 'tap'
import { debounceWithKey, REMOVE_CACHE_ENTRY } from './_pDebounceWithKey.mjs'

const { describe, it } = tap.mocha

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
    assert.equal(await debouncedFn(1), 1)
    assert.equal(await debouncedFn(2), 2)

    // retrieve the already cached values
    assert.equal(await debouncedFn(1), 1)
    assert.equal(await debouncedFn(2), 2)

    // an entry for a specific key can be removed
    debouncedFn(REMOVE_CACHE_ENTRY, 1)
    assert.equal(await debouncedFn(1), 3)
    assert.equal(await debouncedFn(2), 2)
  })
})
