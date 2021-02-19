const Disposable = require('promise-toolbox/Disposable')
const { createLogger } = require('@xen-orchestra/log/dist')

const asyncMap = (arrayLike, mapFn, thisArg) => Promise.all(Array.from(arrayLike, mapFn, thisArg))

const { warn } = createLogger('vates:disposable:debounceResource')

exports.createDebounceResource = () => {
  const flushers = new Set()
  async function debounceResource(pDisposable, delay = debounceResource.defaultDelay) {
    if (delay === 0) {
      return pDisposable
    }

    const disposable = await pDisposable

    let timeoutId
    const disposeWrapper = async () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
        timeoutId = undefined
        flushers.delete(flusher)

        try {
          await disposable.dispose()
        } catch (error) {
          warn(error)
        }
      }
    }

    const flusher = () => {
      const shouldDisposeNow = timeoutId !== undefined
      if (shouldDisposeNow) {
        return disposeWrapper()
      } else {
        // will dispose ASAP
        delay = 0
      }
    }
    flushers.add(flusher)

    return {
      dispose() {
        timeoutId = setTimeout(disposeWrapper, delay)
      },
      value: disposable.value, 
    }
  }
  debounceResource.flushAll = () => {
    // iterate on a sync way in order to not remove a flusher added on processing flushers
    const promise = asyncMap(flushers, flush => flush())
    flushers.clear()
    return promise
  }

  return debounceResource
}
