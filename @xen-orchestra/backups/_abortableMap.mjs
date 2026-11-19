// Similar to `Promise.all` + `map` but passes an abort signal to the callback
//
// If any of the executions fails, the signal is aborted (it also follows the optional parent `signal`) and, once the
// other executions have settled, the first reason is rejected: the caller does not clean up while they are still
// running.
export async function abortableMap(signal, iterable, callback) {
  const controller = new AbortController()
  const childSignal = signal === undefined ? controller.signal : AbortSignal.any([signal, controller.signal])

  const promises = []
  try {
    for (const item of iterable) {
      promises.push(callback(childSignal, item))
    }
    return await Promise.all(promises)
  } catch (error) {
    controller.abort(error)
    await Promise.allSettled(promises)
    throw error
  }
}
