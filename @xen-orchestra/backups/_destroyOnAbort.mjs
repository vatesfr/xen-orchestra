const noop = Function.prototype

/**
 * Destroys `stream` with the reason of `signal` once it is aborted, right away if it already is.
 *
 * Nothing may be listening to the stream when it is destroyed: an error event without a listener would crash the
 * process, so a noop listener is added.
 *
 * @param {import('node:stream').Readable} stream
 * @param {AbortSignal} [signal] nothing is done without a signal, e.g. a restore run outside a task
 * @returns {() => void} removes the abort listener
 */
export function destroyOnAbort(stream, signal) {
  if (signal === undefined) {
    return noop
  }

  stream.on('error', noop)

  const onAbort = () => stream.destroy(signal.reason)
  if (signal.aborted) {
    onAbort()
    return noop
  }

  signal.addEventListener('abort', onAbort, { once: true })
  return () => signal.removeEventListener('abort', onAbort)
}
