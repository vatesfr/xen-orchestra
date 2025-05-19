import { MaybePromise } from './helper.type.mjs'

export type AsyncCacheEntry<T> = {
  current: T | Promise<T>
  expires?: number
  previous?: T | Promise<T>
}

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
 */
export async function getFromAsyncCache<T>(
  cache: Map<string, AsyncCacheEntry<MaybePromise<T>>>,
  key: string,
  fn: () => Promise<T>,
  { expiresIn = 60000, timeout = 5000, forceRefresh = false } = {}
): Promise<{ value: T | undefined; isExpired?: true } | undefined> {
  if (forceRefresh) {
    cache.delete(key)
  }

  const { current, expires } = cache.get(key) ?? {}
  if (current === undefined || (expires ?? 0) < Date.now()) {
    const _promise = fn()

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
  const timeoutPromise = new Promise<never>(
    (resolve, reject) =>
      (timeoutId = setTimeout(() => reject(new Error('Promise timed out', { cause: 'ERR_TIMEOUT' })), timeout))
  )

  const result = {} as {
    value: T | undefined
    isExpired?: true
  }

  try {
    result.value = await Promise.race([timeoutPromise, cache.get(key)!.current])
  } catch (error) {
    if (error instanceof Error && error.cause !== 'ERR_TIMEOUT') {
      throw error
    }

    result.value = await cache.get(key)!.previous
    if (result.value !== undefined) {
      result.isExpired = true
    }
  } finally {
    clearTimeout(timeoutId)
  }

  return result
}
