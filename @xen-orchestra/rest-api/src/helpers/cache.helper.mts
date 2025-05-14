// @ts-nocheck
/**
 *
 * If the value is cached and not expired, it will return
 * the cached value immediately. If expired or not present, it will invoke the provided
 * function to fetch the value, cache it, and return it.
 *
 * The function also handles timeout for fetching the value, ensuring that if fetching
 * takes too long, it resolves to `undefined` or returns the expired value based on the
 * cache's state.
 *
 * @param {Map<string, Promise<T>>} cache
 * @param {string} key
 * @param {() => Promise<T>} fn
 * @param {Object} [options]
 * @param {number} [options.timeout] - default to 5000ms
 * @param {number} [options.expiresIn] - default to 60000ms
 * @param {boolean} [options.forceRefresh] - default to `false`
 *
 * @returns {Promise<{value: T, isExpired?: boolean} | undefined>}
 */
export const getFromAsyncCache = async (
  cache,
  key,
  fn,
  { expiresIn = 60000, timeout = 5000, forceRefresh = false } = {}
) => {
  if (forceRefresh) {
    cache.delete(key)
  }

  const { current, expires } = cache.get(key) ?? {}
  if (current === undefined || expires < Date.now()) {
    const _promise = fn()

    if (_promise.then === undefined) {
      throw new Error('fn need to be asynchronous')
    }

    const promise = _promise.then(result => {
      cache.set(key, {
        current: result,
        expires: Date.now() + expiresIn,
        previous: undefined,
      })

      return result
    })

    cache.set(key, {
      current: promise,
      previous: current,
      expires: undefined,
    })
  }

  let timeoutId
  const timeoutPromise = new Promise(
    (resolve, reject) =>
      (timeoutId = setTimeout(() => reject(new Error('Promise timed out', { cause: 'ERR_TIMEOUT' })), timeout))
  )

  const result = {}
  try {
    result.value = await Promise.race([timeoutPromise, cache.get(key).current])
  } catch (error) {
    if (error.cause !== 'ERR_TIMEOUT') {
      throw error
    }

    result.value = cache.get(key).previous
    if (result.value !== undefined) {
      result.isExpired = true
    }
  } finally {
    clearTimeout(timeoutId)
  }

  return result
}
