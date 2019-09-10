import ensureArray from './_ensureArray'
import MultiKeyMap from './_MultiKeyMap'

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
  return function() {
    const keys = ensureArray(keyFn.apply(this, arguments))
    let promise = cache.get(keys)
    if (promise === undefined) {
      cache.set(keys, (promise = fn.apply(this, arguments)))
      const remove = scheduleRemoveCacheEntry.bind(
        cache,
        keys,
        Date.now() + delayFn.apply(this, arguments)
      )
      promise.then(remove, remove)
    }
    return promise
  }
}

debounceWithKey.decorate = (...params) => (target, name, descriptor) => ({
  ...descriptor,
  value: debounceWithKey(descriptor.value, ...params),
})
