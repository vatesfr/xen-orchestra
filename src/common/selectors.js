import checkPermissions from 'xo-acl-resolver'
import filter from 'lodash/filter'
import find from 'lodash/find'
import forEach from 'lodash/forEach'
import isArray from 'lodash/isArray'
import isArrayLike from 'lodash/isArrayLike'
import isFunction from 'lodash/isFunction'
import memoize from 'lodash/memoize'
import orderBy from 'lodash/orderBy'
import pickBy from 'lodash/pickBy'
import slice from 'lodash/slice'
import { createSelector as create } from 'reselect'

import shallowEqual from './shallow-equal'
import { EMPTY_OBJECT, invoke } from './utils'

// ===================================================================

export {
  // That's usually the name we want to import.
  createSelector,

  // But selectors.create is nice too :)
  createSelector as create
} from 'reselect'

// -------------------------------------------------------------------

// Wraps a function which returns a collection to returns the previous
// result if the collection has not really changed (ie still has the
// same items).
//
// Use case: in connect, to avoid rerendering a component where the
// objects are still the same.
const _createCollectionWrapper = selector => {
  let cache

  return (...args) => {
    const value = selector(...args)
    if (!shallowEqual(value, cache)) {
      cache = value
    }
    return cache
  }
}
export { _createCollectionWrapper as createCollectionWrapper }

const _SELECTOR_PLACEHOLDER = Symbol('selector placeholder')

// Experimental!
//
// Similar to reselect's createSelector() but inputs can be either
// selectors or plain values.
//
// To pass a function as a plain value, simply wrap it with an array.
const _create2 = (...inputs) => {
  const resultFn = inputs.pop()

  if (inputs.length === 1 && isArray(inputs[0])) {
    inputs = inputs[0]
  }

  const n = inputs.length

  const inputSelectors = []
  for (let i = 0; i < n; ++i) {
    const input = inputs[i]

    if (isFunction(input)) {
      inputSelectors.push(input)
      inputs[i] = _SELECTOR_PLACEHOLDER
    } else if (isArray(input) && input.length === 1) {
      inputs[i] = input[0]
    }
  }

  if (!inputSelectors.length) {
    throw new Error('no input selectors')
  }

  return create(inputSelectors, function () {
    const args = new Array(n)
    for (let i = 0, j = 0; i < n; ++i) {
      const input = inputs[i]
      args[i] = input === _SELECTOR_PLACEHOLDER
        ? arguments[j++]
        : input
    }

    return resultFn.apply(this, args)
  })
}

// ===================================================================
// Generic selector creators.

export const createFilter = (objects, predicate, predicateIsSelector) =>
  _createCollectionWrapper(
    predicateIsSelector
      ? create(
        objects,
        predicate,
        (objects, predicate) => predicate
          ? (isArrayLike(objects) ? filter : pickBy)(objects, predicate)
          : objects
      )
      : create(
        objects,
        objects => (isArrayLike(objects) ? filter : pickBy)(objects, predicate)
      )
  )

export const createFinder = (collectionSelector, predicate, predicateIsSelector) =>
  predicateIsSelector
    ? create(
      collectionSelector,
      predicate,
      find
    )
    : create(
      collectionSelector,
      collection => find(collection, predicate)
    )

export const createPager = (arraySelector, pageSelector, n = 25) => _createCollectionWrapper(
  create(
    arraySelector,
    pageSelector,
    (array, page) => {
      const start = (page - 1) * n
      return slice(array, start, start + n)
    }
  )
)

export const createSort = (
  collection,
  getter = 'name_label',
  order = 'asc'
) => _create2(collection, getter, order, orderBy)

export const createTop = (objectsSctor, iteratee, n) =>
  _createCollectionWrapper(
    create(
      objectsSctor,
      objects => {
        let results = orderBy(objects, iteratee, 'desc')
        if (n < results.length) {
          results.length = n
        }
        return results
      }
    )
  )

// ===================================================================
// Root-ish selectors (no dependencies).

const _getId = (state, { routeParams, id }) => routeParams
  ? routeParams.id
  : id

// _createCollectionWrapper(create(
//   state => state.objects,
//   _createCollectionWrapper(state => {
//     const { user } = state
//     if (user && user.permission === 'admin') {
//       return true
//     }

//     return state.permissions
//   }),
//   (objects, permissions) => {
//     if (permissions === true) {
//       return objects
//     }

//     if (!permissions) {
//       return EMPTY_OBJECT
//     }

//     const getObject = id => (objects[id] || EMPTY_OBJECT)

//     return pickBy(objects, (_, id) => checkPermissions(
//       permissions,
//       getObject,
//       [ [ id, 'view' ] ]
//     ))
//   }
// ))

// ===================================================================
// Common selector creators.

export const createGetObject = (idSelector = _getId) =>
  (state, props) => state.objects.all[idSelector(state, props)]

export const createGetObjectsOfType = type =>
  state => state.objects.byType[type] || EMPTY_OBJECT

export const createGetSortedObjectsOfType = invoke(() => {
  const optionsByType = {
    message: [
      [ message => message.time ],
      'desc'
    ],
    'VM-snapshot': [
      [ snapshot => snapshot.snapshot_time ],
      'desc'
    ]
  }
  const defaults = [
    [ object => object.name_label ]
  ]
  const getOptions = type => optionsByType[type] || defaults

  return memoize(type =>
    createSort(createGetObjectsOfType(type), ...getOptions(type))
  )
})
