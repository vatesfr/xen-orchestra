import asyncMap from '@xen-orchestra/async-map'
import Disposable from 'promise-toolbox/Disposable'

const disposers = []
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

      return disposable.dispose()
    }
  }

  disposers.push(() => {
    const shouldDisposeNow = timeoutId !== undefined
    if (shouldDisposeNow) {
      return disposeWrapper()
    } else {
      // will dispose ASAP
      delay = 0
    }
  })

  return new Disposable(disposable.value, () => {
    timeoutId = setTimeout(disposeWrapper, delay)
  })
}
debounceResource.flushAll = () => asyncMap(disposers, dispose => dispose())
