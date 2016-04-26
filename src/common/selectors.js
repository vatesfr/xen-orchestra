import every from 'lodash/every'
import filter from 'lodash/filter'
import find from 'lodash/find'
import forEach from 'lodash/forEach'
import isArrayLike from 'lodash/isArrayLike'
import orderBy from 'lodash/orderBy'
import pickBy from 'lodash/pickBy'
import slice from 'lodash/slice'
import sortBy from 'lodash/sortBy'
import { createSelector as create } from 'reselect'
import { invoke } from 'utils'

// ===================================================================

export { create }

// -------------------------------------------------------------------

// Wraps a function which returns a collection to returns the previous
// result if the collection has not really changed (ie still has the
// same items).
//
// Use case: in connect, to avoid rerendering a component where the
// objects are still the same.
const _createCollectionWrapper = invoke(
  (c1, c2) => {
    if (c1 === c2) {
      return true
    }

    const type = typeof c1
    if (type !== typeof c2) {
      return false
    }

    if (type === 'array') {
      if (c1.length !== c2.length) {
        return false
      }
    }

    return every(c1, (value, key) => c2[key] === value)
  },
  (areCollectionsEqual) => (selector) => {
    let cache

    return (...args) => {
      const value = selector(...args)
      if (!areCollectionsEqual(value, cache)) {
        cache = value
      }
      return cache
    }
  }
)

export { _createCollectionWrapper as createCollectionWrapper }

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
        (objects) => (isArrayLike(objects) ? filter : pickBy)(objects, predicate)
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
      (collection) => find(collection, predicate)
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

export const createSort = invoke(
  (object) => object.name_label,
  (_getNameLabel) => (objects, getter = _getNameLabel) => create(
    objects,
    (objects) => sortBy(objects, getter)
  )
)

export const createTop = (objectsSctor, iteratee, n) =>
  _createCollectionWrapper(
    create(
      objectsSctor,
      (objects) => {
        let results = orderBy(objects, iteratee, 'desc')
        if (n < results.length) {
          results.length = n
        }
        return results
      }
    )
  )

// ===================================================================
// Private selectors.

const _id = (state, props) => props.params.id
const _objects = (state) => state.objects
const _vms = createFilter(
  _objects,
  (object) => object.type === 'VM'
)

export { _objects as objects }

// ===================================================================
// Common selector creators.

export const createGetObject = (id = _id) => create(
  _objects,
  id,
  (objects, id) => objects[id]
)

export const createGetObjects = (ids) => _createCollectionWrapper(
  create(
    _objects,
    ids,
    (objects, ids) => {
      const result = {}
      forEach(ids, (id) => {
        result[id] = objects[id]
      })
      return result
    }
  )
)

// ===================================================================
// Global selectors.

export { _objects as objects }

export const hosts = createSort(
  createFilter(_objects, (object) => object.type === 'host')
)

export const messages = createSort(
  createFilter(_objects, (object) => object.type === 'message'),
  (message) => -message.time
)

export const userSrs = createSort(
  createFilter(_objects, (object) => object.type === 'SR' && object.content_type === 'user')
)

export const pools = createSort(
  createFilter(_objects, (object) => object.type === 'pool')
)

export const tasks = createSort(
  createFilter(_objects, (object) => object.type === 'task')
)

export const vmContainers = _createCollectionWrapper(
  create(
    _objects,
    _vms,
    (objects, vms) => {
      const containers = {}
      forEach(vms, (vm) => {
        const id = vm.$container
        if (!containers[id]) {
          containers[id] = objects[id]
        }
      })
      return containers
    }
  )
)

export const vms = createSort(_vms)
