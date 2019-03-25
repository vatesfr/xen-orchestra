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
export default (fn, delay, keyFn = defaultKeyFn) => {
  const cache = new MultiKeyMap()
  return function() {
    const keys = ensureArray(keyFn.apply(this, arguments))
    let promise = cache.get(keys)
    if (promise === undefined) {
      cache.set(keys, (promise = fn.apply(this, arguments)))
      promise.then(
        scheduleRemoveCacheEntry.bind(cache, keys, Date.now() + delay)
      )
    }
    return promise
  }
}
