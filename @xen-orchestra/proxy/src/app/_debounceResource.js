import Disposable from 'promise-toolbox/Disposable'

export async function debounceResource(pDisposable, hooks, delay = 0) {
  if (delay === 0) {
    return pDisposable
  }

  const disposable = await pDisposable

  let timeoutId
  const disposeWrapper = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
      timeoutId = undefined
      hooks.removeListener('stop', onStop)

      return disposable.dispose()
    }
  }

  const onStop = () => {
    const shouldDisposeNow = timeoutId !== undefined
    if (shouldDisposeNow) {
      return disposeWrapper()
    } else {
      // will dispose ASAP
      delay = 0
    }
  }
  hooks.on('stop', onStop)

  return new Disposable(disposable.value, () => {
    timeoutId = setTimeout(disposeWrapper, delay)
  })
}
