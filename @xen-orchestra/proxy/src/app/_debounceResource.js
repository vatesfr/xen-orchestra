import asyncMapSettled from '@xen-orchestra/async-map'
import Disposable from 'promise-toolbox/Disposable'

const disposers = new Set()
export async function debounceResource(pDisposable, delay) {
  if (delay === 0) {
    return pDisposable
  }

  const disposable = await pDisposable

  let timeoutId
  const disposeWrapper = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
      timeoutId = undefined
      disposers.delete(disposer)

      return disposable.dispose()
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
  disposers.add(disposer)

  return new Disposable(disposable.value, () => {
    timeoutId = setTimeout(disposeWrapper, delay)
  })
}
debounceResource.flushAll = () =>
  asyncMapSettled([...disposers], dispose => {
    disposers.delete(dispose)
    return dispose()
  })
