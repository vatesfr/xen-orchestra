import checkPermissions from 'xo-acl-resolver'
import filter from 'lodash/filter'
import find from 'lodash/find'
import forEach from 'lodash/forEach'
import isArrayLike from 'lodash/isArrayLike'
import orderBy from 'lodash/orderBy'
import pickBy from 'lodash/pickBy'
import slice from 'lodash/slice'
import sortBy from 'lodash/sortBy'
import { createSelector as create } from 'reselect'
import {
  EMPTY_OBJECT,
  invoke
} from 'utils'

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
      const { length } = c1
      if (length !== c2.length) {
        return false
      }

      for (let i = 0; i < length; ++i) {
        if (c1[i] !== c2[i]) {
          return false
        }
      }

      return true
    }

    let n = 0
    for (const _ in c2) { // eslint-disable-line no-unused-vars
      ++n
    }

    for (const key in c1) {
      if (c1[key] !== c2[key]) {
        return false
      }
      --n
    }

    return !n
  },
  areCollectionsEqual => selector => {
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

export const createSort = invoke(
  object => object.name_label,
  _getNameLabel => (objects, getter = _getNameLabel) => create(
    objects,
    objects => sortBy(objects, getter)
  )
)

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
// Private selectors.

const _id = (state, props) => props.params.id

const _objects = _createCollectionWrapper(create(
  state => state.objects,
  _createCollectionWrapper(state => {
    const { user } = state
    if (user && user.permission === 'admin') {
      return true
    }

    return state.permissions
  }),
  (objects, permissions) => {
    if (permissions === true) {
      return objects
    }

    if (!permissions) {
      return EMPTY_OBJECT
    }

    const getObject = id => (objects[id] || {})

    return pickBy(objects, (_, id) => checkPermissions(
      permissions,
      getObject,
      [ [ id, 'view' ] ]
    ))
  }
))
export { _objects as objects }

const _hosts = createFilter(
  _objects,
  object => object.type === 'host'
)
const _userSrs = createFilter(
  _objects,
  object => object.type === 'SR' && object.content_type === 'user'
)
const _vms = createFilter(
  _objects,
  object => object.type === 'VM'
)

// ===================================================================
// Common selector creators.

export const createGetObject = (id = _id) => create(
  _objects,
  id,
  (objects, id) => objects[id]
)

export const createGetObjects = ids => _createCollectionWrapper(
  create(
    _objects,
    ids,
    (objects, ids) => {
      const result = {}
      forEach(ids, id => {
        result[id] = objects[id]
      })
      return result
    }
  )
)

// ===================================================================
// Global selectors.

export const hosts = createSort(_hosts)

export const messages = createSort(
  createFilter(_objects, object => object.type === 'message'),
  message => -message.time
)

export const userSrs = createSort(_userSrs)

export const pools = createSort(
  createFilter(_objects, object => object.type === 'pool')
)

export const tasks = createSort(
  createFilter(_objects, object => object.type === 'task' && object.status === 'pending')
)

export const tags = create(
  _objects,
  objects => {
    const tags = {}
    forEach(objects, object => {
      forEach(object.tags, tag => {
        tags[tag] = true
      })
    })
    return Object.keys(tags)
  }
)

const _createObjectContainers = (set, container = '$container') =>
  _createCollectionWrapper(
    create(
      _objects,
      set,
      (objects, set) => {
        const containers = {}
        forEach(set, o => {
          const id = o[container]
          if (!containers[id]) {
            containers[id] = objects[id]
          }
        })
        return containers
      }
    )
  )

export const hostContainers = _createObjectContainers(_hosts, '$pool')
export const userSrsContainers = _createObjectContainers(_userSrs)
export const vmContainers = _createObjectContainers(_vms)

export const vms = createSort(_vms)
