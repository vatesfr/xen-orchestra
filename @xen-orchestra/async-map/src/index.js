// @flow

import { map } from 'lodash'

// Similar to map() + Promise.all() but wait for all promises to
// settle before rejecting (with the first error)
const asyncMap = <T1, T2>(
  collection: Array<T1> | Promise<Array<T1>>,
  iteratee: (value: T1, key: number, collection: Array<T1>) => T2
): Promise<Array<T2>> => {
  if (!Array.isArray(collection)) {
    return collection.then(collection => asyncMap(collection, iteratee))
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
