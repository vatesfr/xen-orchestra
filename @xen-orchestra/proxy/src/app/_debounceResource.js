import asyncMapSettled from '@xen-orchestra/async-map'
import Disposable from 'promise-toolbox/Disposable'
import { createLogger } from '@xen-orchestra/log/dist'

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
        flushers.delete(disposer)

        try {
          await disposable.dispose()
        } catch (error) {
          warn(error)
        }
      }
    }

    const disposer = () => {
      const shouldDisposeNow = timeoutId !== undefined
      if (shouldDisposeNow) {
        return disposeWrapper()
      } else {
        // will dispose ASAP
        delay = 0
      }
    }
    flushers.add(disposer)

    return new Disposable(disposable.value, () => {
      timeoutId = setTimeout(disposeWrapper, delay)
    })
  }
  debounceResource.flushAll = () => {
    const currentFlushers = [...flushers]
    flushers.clear()
    return asyncMapSettled(currentFlushers, dispose => dispose())
  }

  return debounceResource
}
