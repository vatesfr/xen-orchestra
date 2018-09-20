// type MaybePromise<T> = Promise<T> | T
//
// declare export function asyncMap<T1, T2>(
//   collection: MaybePromise<T1[]>,
//   (T1, number) => MaybePromise<T2>
// ): Promise<T2[]>
// declare export function asyncMap<K, V1, V2>(
//   collection: MaybePromise<{ [K]: V1 }>,
//   (V1, K) => MaybePromise<V2>
// ): Promise<V2[]>

import map from 'lodash/map'

// Similar to map() + Promise.all() but wait for all promises to
// settle before rejecting (with the first error)
const asyncMap = (collection, iteratee) => {
  let then
  if (collection != null && typeof (then = collection.then) === 'function') {
    return then.call(collection, collection => asyncMap(collection, iteratee))
  }

  let errorContainer
  const onError = error => {
    if (errorContainer === undefined) {
      errorContainer = { error }
    }
  }

  return Promise.all(
    map(collection, (item, key, collection) =>
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

export { asyncMap as default }
