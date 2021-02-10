import Disposable from 'promise-toolbox/Disposable'
import { createLogger } from '@xen-orchestra/log/dist'

import { asyncMap } from '../_asyncMap'

const { warn } = createLogger('xo:proxy:debounceResource')

export const createDebounceResource = defaultDelay => {
  const flushers = new Set()
  async function debounceResource(pDisposable, delay = defaultDelay) {
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

    return new Disposable(disposable.value, () => {
      timeoutId = setTimeout(disposeWrapper, delay)
    })
  }
  debounceResource.flushAll = () => {
    // iterate on a sync way in order to not remove a flusher added on processing flushers
    const promise = asyncMap(flushers, flush => flush())
    flushers.clear()
    return promise
  }

  return debounceResource
}
