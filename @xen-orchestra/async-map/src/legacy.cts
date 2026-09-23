import map = require('lodash/map')

type MaybePromise<T> = T | PromiseLike<T>

/**
 * Similar to map() + Promise.all() but wait for all promises to settle before
 * rejecting (with the first error)
 *
 * @deprecated Don't support iterables, please use new implementations
 */
function asyncMapLegacy<T, R>(
  collection: MaybePromise<readonly T[] | null | undefined>,
  iteratee: (value: T, key: number, collection: readonly T[]) => MaybePromise<R>
): Promise<R[]>
/**
 * @deprecated Don't support iterables, please use new implementations
 */
function asyncMapLegacy<V, R>(
  collection: MaybePromise<Record<string, V> | null | undefined>,
  iteratee: (value: V, key: string, collection: Record<string, V>) => MaybePromise<R>
): Promise<R[]>

// the implementation signature is intentionally untyped: it has to accept both
// overloads as well as the promises and array-likes `lodash/map` handles
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asyncMapLegacy(collection: any, iteratee: (...args: any[]) => any): Promise<any[]> {
  let then
  if (collection != null && typeof (then = collection.then) === 'function') {
    return then.call(collection, (collection: unknown) => asyncMapLegacy(collection as never, iteratee))
  }

  let errorContainer: { error: unknown } | undefined
  const onError = (error: unknown) => {
    if (errorContainer === undefined) {
      errorContainer = { error }
    }
  }

  return Promise.all(
    map(collection, (item: unknown, key: unknown, collection: unknown) =>
      new Promise(resolve => {
        resolve(iteratee(item, key, collection))
      }).catch(onError)
    )
  ).then(values => {
    if (errorContainer !== undefined) {
      throw errorContainer.error
    }
    return values
  })
}

export = asyncMapLegacy
