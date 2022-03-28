import { MultiKeyMap } from '@vates/multi-key-map'

import ensureArray from './_ensureArray.mjs'

function removeCacheEntry(cache, keys) {
  cache.delete(keys)
}

function scheduleRemoveCacheEntry(keys, expires) {
  const delay = expires - Date.now()
  if (delay <= 0) {
    removeCacheEntry(this, keys)
  } else {
    setTimeout(removeCacheEntry, delay, this, keys)
  }
}

const defaultKeyFn = () => []

const { slice } = Array.prototype

export const REMOVE_CACHE_ENTRY = {}

// debounce an async function so that all subsequent calls in a delay receive
// the same result
//
// similar to `p-debounce` with `leading` set to `true` but with key support
//
// - `delay`: number of milliseconds to cache the response, a function can be
//   passed to use a custom delay for a call based on its parameters
export const debounceWithKey = (fn, delay, keyFn = defaultKeyFn) => {
  const cache = new MultiKeyMap()
  const delayFn = typeof delay === 'number' ? () => delay : delay
  return function (arg) {
    if (arg === REMOVE_CACHE_ENTRY) {
      return removeCacheEntry(cache, ensureArray(keyFn.apply(this, slice.call(arguments, 1))))
    }

    const keys = ensureArray(keyFn.apply(this, arguments))
    let promise = cache.get(keys)
    if (promise === undefined) {
      cache.set(
        keys,
        (promise = new Promise(resolve => {
          resolve(fn.apply(this, arguments))
        }))
      )
      const delay = delayFn.apply(this, arguments)
      if (delay !== Infinity) {
        const remove = scheduleRemoveCacheEntry.bind(cache, keys, Date.now() + delay)
        promise.then(remove, remove)
      }
    }
    return promise
  }
}
