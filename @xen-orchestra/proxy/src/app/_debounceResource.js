import Disposable from 'promise-toolbox/Disposable'

export async function debounceResource(pDisposable, addDisposeListener = dispose => Function.prototype, delay = 0) {
  if (delay === 0) {
    return pDisposable
  }

  const disposable = await pDisposable

  let timeoutId
  const disposeWrapper = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
      timeoutId = undefined
      removeDisposeListener()

      return disposable.dispose()
    }
  }

  const removeDisposeListener = addDisposeListener(() => {
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
