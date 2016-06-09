import checkPermissions from 'xo-acl-resolver'
import filter from 'lodash/filter'
import find from 'lodash/find'
import forEach from 'lodash/forEach'
import groupBy from 'lodash/groupBy'
import isArray from 'lodash/isArray'
import isArrayLike from 'lodash/isArrayLike'
import isFunction from 'lodash/isFunction'
import orderBy from 'lodash/orderBy'
import pickBy from 'lodash/pickBy'
import size from 'lodash/size'
import slice from 'lodash/slice'
import { createSelector as create } from 'reselect'

import shallowEqual from './shallow-equal'
import { EMPTY_ARRAY, EMPTY_OBJECT, invoke } from './utils'

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

export const createCounter = (collection, predicate) =>
  _create2(
    collection,
    predicate,
    (collection, predicate) => {
      if (!predicate) {
        return size(collection)
      }

      let count = 0
      forEach(collection, item => {
        if (predicate(item)) {
          ++count
        }
      })
      return count
    }
  )

// Creates an object selector from an object selector and a properties
// selector.
//
// Should only be used with a reasonable number of properties.
export const createPicker = (object, props) =>
  _createCollectionWrapper(
    _create2(
      object, props,
      (object, props) => {
        const values = {}
        forEach(props, prop => {
          const value = object[prop]
          if (value) {
            values[prop] = value
          }
        })
        return values
      }
    )
  )

// Special cases:
// - predicate == null → no filtering
// - predicate === false → everything is filtered out
export const createFilter = (collection, predicate) =>
  _createCollectionWrapper(
    _create2(
      collection,
      predicate,
      (collection, predicate) => predicate === false
        ? (isArrayLike(collection) ? EMPTY_ARRAY : EMPTY_OBJECT)
        : predicate
          ? (isArrayLike(collection) ? filter : pickBy)(collection, predicate)
          : collection
    )
  )

export const createFinder = (collection, predicate) =>
  _create2(
    collection,
    predicate,
    find
  )

export const createGroupBy = (collection, getter) =>
  _create2(
    collection,
    getter,
    groupBy
  )

export const createPager = (array, page, n = 25) => _createCollectionWrapper(
  _create2(
    array,
    page,
    n,
    (array, page, n) => {
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

export const createTop = (collection, iteratee, n) =>
  _createCollectionWrapper(
    _create2(
      collection,
      iteratee,
      n,
      (objects, iteratee, n) => {
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

export const areObjectsFetched = state => state.objects.fetched

const _getId = (state, { routeParams, id }) => routeParams
  ? routeParams.id
  : id

export const getLang = state => state.lang

export const getUser = state => state.user

const _getPermissionsPredicate = invoke(() => {
  const getPredicate = create(
    state => state.permissions,
    state => state.objects,
    (permissions, objects) => {
      objects = objects.all
      const getObject = id => (objects[id] || EMPTY_OBJECT)

      return id => checkPermissions(permissions, getObject, id.id || id, 'view')
    }
  )

  return state => {
    const user = getUser(state)
    if (!user) {
      return false
    }

    if (user.permission === 'admin') {
      return // No predicate means no filtering.
    }

    return getPredicate(state)
  }
})

// ===================================================================
// Common selector creators.

// Creates an object selector from an id selector.
export const createGetObject = (idSelector = _getId) =>
  (state, props) => {
    const object = state.objects.all[idSelector(state, props)]
    if (!object) {
      return
    }

    const predicate = _getPermissionsPredicate(state)
    if (!predicate) {
      if (predicate == null) {
        return object // no filtering
      }

      // predicate is false.
      return
    }

    if (predicate(object)) {
      return object
    }
  }

// Specialized createSort() configured for a given type.
export const createSortForType = invoke(() => {
  const optionsByType = {
    message: [
      [ message => message.time ],
      'desc'
    ],
    PIF: [
      [ pif => pif.device ]
    ],
    pool_patch: [
      [ patch => patch.name ]
    ],
    VBD: [
      [ vbd => vbd.position ]
    ],
    'VDI-snapshot': [
      [ snapshot => snapshot.snapshot_time ],
      'desc'
    ],
    'VM-snapshot': [
      [ snapshot => snapshot.snapshot_time ],
      'desc'
    ]
  }
  const defaults = [
    [ [ object => object.$pool, object => object.name_label ] ]
  ]
  const getOptions = type => optionsByType[type] || defaults

  return (type, collection) => createSort(collection, ...getOptions(type))
})

// Add utility methods to a collection selector.
const _extendCollectionSelector = (selector, objectsType) => {
  // Terminal methods.
  const _addCount = selector => {
    selector.count = predicate => createCounter(selector, predicate)
    return selector
  }
  _addCount(selector)
  const _addGroupBy = selector => {
    selector.groupBy = getter => createGroupBy(selector, getter)
    return selector
  }
  _addGroupBy(selector)
  selector.find = predicate => createFinder(selector, predicate)

  // groupBy can be chained.
  const _addSort = selector => {
    // TODO: maybe memoize when no idsSelector.
    selector.sort = () => _addGroupBy(createSortForType(objectsType, selector))
    return selector
  }
  _addSort(selector)

  // groupBy and sort can be chained.
  selector.pick = idsSelector => _addGroupBy(_addSort(
    createPicker(selector, idsSelector)
  ))

  // count, groupBy and sort can be chained.
  selector.filter = predicate => _addCount(_addGroupBy(_addSort(
    createFilter(selector, predicate)
  )))

  return selector
}

// Creates a collection selector which returns all objects of a given
// type.
//
// The selector as the following methods:
//
// - count: returns a selector which returns the number of objects
// - filter: returns a selector which returns the objects filtered by
//           a predicate (count, groupBy and sort can be chained)
// - find: returns a selector which returns the first object matching
//         a predicate
// - groupBy: returns a selector which returns the objects grouped by
//            a value determined by a getter selector
// - pick: returns a selector which returns only the objects with given
//         ids (groupBy and sort can be chained)
// - sort: returns a selector which returns the objects appropriately
//         sorted (groupBy can be chained)
export const createGetObjectsOfType = type => {
  const getObjects = state => state.objects.byType[type] || EMPTY_OBJECT

  return _extendCollectionSelector(createFilter(
    getObjects,
    _getPermissionsPredicate
  ), type)
}

// TODO: implement
export const createGetTags = () => {
  const getTags = () => EMPTY_OBJECT

  return _extendCollectionSelector(getTags, 'tag')
}

export const createGetObjectMessages = objectSelector =>
  createGetObjectsOfType('message').filter(
    create(
      objectSelector,
      ({ id }) => message => message.$object === id
    )
  ).sort()
