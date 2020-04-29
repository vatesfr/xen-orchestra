import ensureArray from './_ensureArray'
import MultiKeyMap from './_MultiKeyMap'

const defaultKeyFn = Function.prototype

export const coalesceCalls = (fn, keyFn = defaultKeyFn) => {
  const promises = new MultiKeyMap()
  return function() {
    const keys = ensureArray(keyFn.apply(this, arguments))
    let promise = promises.get(keys)
    if (promise === undefined) {
      promise = fn.apply(this, arguments)
      promises.set(keys, promise)
      const unset = () => {
        promises.delete(keys)
      }
      promise.then(unset, unset)
    }
    return promise
  }
}
