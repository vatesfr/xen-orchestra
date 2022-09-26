import add from 'lodash/add'
import defined from '@xen-orchestra/defined'
import { check as checkPermissions } from 'xo-acl-resolver'
import { createSelector as create } from 'reselect'
import {
  difference,
  filter,
  find,
  forEach,
  forOwn,
  groupBy,
  identity,
  isArrayLike,
  isEmpty,
  keyBy,
  keys,
  map,
  orderBy,
  pick,
  pickBy,
  size,
  slice,
  some,
} from 'lodash'

import invoke from './invoke'
import shallowEqual from './shallow-equal'
import { EMPTY_ARRAY, EMPTY_OBJECT, getDetachedBackupsOrSnapshots } from './utils'

// ===================================================================

export {
  // That's usually the name we want to import.
  createSelector,
  // But selectors.create is nice too :)
  createSelector as create,
} from 'reselect'

// -------------------------------------------------------------------

// Wraps a function which returns a collection to returns the previous
// result if the collection has not really changed (ie still has the
// same items).
//
// Use case: in connect, to avoid rerendering a component where the
// objects are still the same.
const _createCollectionWrapper = selector => {
  let cache, previous

  return (...args) => {
    const value = selector(...args)
    if (value !== previous) {
      previous = value

      if (!shallowEqual(value, cache)) {
        cache = value
      }
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

  if (inputs.length === 1 && Array.isArray(inputs[0])) {
    inputs = inputs[0]
  }

  const n = inputs.length

  const inputSelectors = []
  for (let i = 0; i < n; ++i) {
    const input = inputs[i]

    if (typeof input === 'function') {
      inputSelectors.push(input)
      inputs[i] = _SELECTOR_PLACEHOLDER
    } else if (Array.isArray(input) && input.length === 1) {
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
      args[i] = input === _SELECTOR_PLACEHOLDER ? arguments[j++] : input
    }

    return resultFn.apply(this, args)
  })
}

// ===================================================================
// Generic selector creators.

export const createCounter = (collection, predicate) =>
  _create2(collection, predicate, (collection, predicate) => {
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
  })

// Creates an object selector from an object selector and a properties
// selector.
//
// Should only be used with a reasonable number of properties.
export const createPicker = (object, props) =>
  _create2(
    object,
    props,
    _createCollectionWrapper((object, props) => {
      const values = {}
      forEach(props, prop => {
        const value = object[prop]
        if (value) {
          values[prop] = value
        }
      })
      return values
    })
  )

// Special cases:
// - predicate == null → no filtering
// - predicate === false → everything is filtered out
export const createFilter = (collection, predicate) =>
  _create2(
    collection,
    predicate,
    _createCollectionWrapper((collection, predicate) =>
      predicate === false
        ? isArrayLike(collection)
          ? EMPTY_ARRAY
          : EMPTY_OBJECT
        : predicate
        ? (isArrayLike(collection) ? filter : pickBy)(collection, predicate)
        : collection
    )
  )

export const createFinder = (collection, predicate) => _create2(collection, predicate, find)

export const createGroupBy = (collection, getter) => _create2(collection, getter, groupBy)

export const createPager = (array, page, n = 25) =>
  _create2(
    array,
    page,
    n,
    _createCollectionWrapper((array, page, n) => {
      const start = (page - 1) * n
      return slice(array, start, start + n)
    })
  )

export const createSort = (collection, getter = 'name_label', order = 'asc') =>
  _create2(collection, getter, order, orderBy)

export const createSumBy = (itemsSelector, iterateeSelector) =>
  _create2(itemsSelector, iterateeSelector, (items, iteratee) => map(items, iteratee).reduce(add, 0))

export const createTop = (collection, iteratee, n) =>
  _create2(
    collection,
    iteratee,
    n,
    _createCollectionWrapper((objects, iteratee, n) => {
      const results = orderBy(objects, iteratee, 'desc')
      if (n < results.length) {
        results.length = n
      }
      return results
    })
  )

// ===================================================================
// Root-ish selectors (no dependencies).

export const areObjectsFetched = state => state.objects.fetched

const _getId = (state, { routeParams, id }) => (routeParams ? routeParams.id : id)

export const getLang = state => state.lang

export const getStatus = state => state.status

export const getUser = state => state.user

export const getXoaState = state => state.xoaUpdaterState

export const getCheckPermissions = invoke(() => {
  const getPredicate = create(
    state => state.permissions,
    state => state.objects,
    (permissions, objects) => {
      objects = objects.all
      const getObject = id => objects[id] || EMPTY_OBJECT

      return (id, permission) => checkPermissions(permissions, getObject, id, permission)
    }
  )

  const isTrue = () => true
  const isFalse = () => false

  return state => {
    const user = getUser(state)

    if (!user) {
      return isFalse
    }

    if (user.permission === 'admin') {
      return isTrue
    }

    return getPredicate(state)
  }
})

const _getPermissionsPredicate = invoke(() => {
  const getCache = create(identity, () => ({ __proto__: null }))

  const getPredicate = create(
    state => state.permissions,
    state => state.objects,
    (permissions, objects) => {
      const cache = getCache(permissions)
      objects = objects.all
      const getObject = id => objects[id] || EMPTY_OBJECT

      return id => {
        if (typeof id !== 'string') {
          id = id.id
        }
        let allowed = cache[id]
        if (allowed === undefined) {
          allowed = cache[id] = checkPermissions(permissions, getObject, id, 'view')
        }
        return allowed
      }
    }
  )

  return (state, props, useResourceSet) => {
    const user = getUser(state)
    if (!user) {
      return false
    }

    if (user.permission === 'admin' || useResourceSet) {
      return // No predicate means no filtering.
    }

    return getPredicate(state)
  }
})

export const isAdmin = (...args) => {
  const user = getUser(...args)

  return user && user.permission === 'admin'
}

// ===================================================================
// Common selector creators.

// Creates an object selector from an id selector.
export const createGetObject =
  (idSelector = _getId) =>
  (state, props, useResourceSet) => {
    const object = state.objects.all[idSelector(state, props)]
    if (!object) {
      return
    }

    if (useResourceSet) {
      return object
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
  const iterateesByType = {
    message: message => message.time,
    PIF: pif => pif.device,
    patch: patch => patch.name,
    pool: pool => pool.name_label,
    tag: tag => tag,
    VBD: vbd => vbd.position,
    'VDI-snapshot': snapshot => snapshot.snapshot_time,
    'VM-snapshot': snapshot => snapshot.snapshot_time,
  }
  const defaultIteratees = [object => object.$pool, object => object.name_label]
  const getIteratees = type => iterateesByType[type] || defaultIteratees

  const ordersByType = {
    message: 'desc',
    'VDI-snapshot': 'desc',
    'VM-snapshot': 'desc',
  }
  const getOrders = type => ordersByType[type]

  const autoSelector = (type, fn) =>
    typeof type === 'function' ? (state, props) => fn(type(state, props)) : [fn(type)]

  return (type, collection) => createSort(collection, autoSelector(type, getIteratees), autoSelector(type, getOrders))
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
  const _addFind = selector => {
    selector.find = predicate => createFinder(selector, predicate)
    return selector
  }
  _addFind(selector)

  // groupBy can be chained.
  const _addSort = selector => {
    // TODO: maybe memoize when no idsSelector.
    selector.sort = () => _addGroupBy(createSortForType(objectsType, selector))
    return selector
  }
  _addSort(selector)

  // count, groupBy and sort can be chained.
  const _addFilter = selector => {
    selector.filter = predicate => _addCount(_addGroupBy(_addSort(createFilter(selector, predicate))))
    return selector
  }
  _addFilter(selector)

  // filter, groupBy and sort can be chained.
  selector.pick = idsSelector => _addFind(_addFilter(_addGroupBy(_addSort(createPicker(selector, idsSelector)))))

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
//         ids (filter, find, groupBy and sort can be chained)
// - sort: returns a selector which returns the objects appropriately
//         sorted (groupBy can be chained)
export const createGetObjectsOfType = type => {
  const getObjects =
    typeof type === 'function'
      ? (state, props) => state.objects.byType[type(state, props)] || EMPTY_OBJECT
      : state => state.objects.byType[type] || EMPTY_OBJECT

  return _extendCollectionSelector(createFilter(getObjects, _getPermissionsPredicate), type)
}

export const createGetTags = collectionSelectors => {
  if (!collectionSelectors) {
    collectionSelectors = [createGetObjectsOfType('host'), createGetObjectsOfType('pool'), createGetObjectsOfType('VM')]
  }

  const getTags = create(collectionSelectors, (...collections) => {
    const tags = {}

    const addTag = tag => {
      tags[tag] = null
    }
    const addItemTags = item => {
      forEach(item.tags, addTag)
    }
    const addCollectionTags = collection => {
      forEach(collection, addItemTags)
    }
    forEach(collections, addCollectionTags)

    return keys(tags)
  })

  return _extendCollectionSelector(getTags, 'tag')
}

export const createGetVmLastShutdownTime = (getVmId = (_, { vm }) => (vm != null ? vm.id : undefined)) =>
  create(getVmId, createGetObjectsOfType('message'), (vmId, messages) => {
    let max = null
    forEach(messages, message => {
      if (message.$object === vmId && message.name === 'VM_SHUTDOWN' && (max === null || message.time > max)) {
        max = message.time
      }
    })
    return max
  })

export const createGetObjectMessages = objectSelector =>
  createGetObjectsOfType('message')
    .filter(
      create(
        (...args) => objectSelector(...args).id,
        id => message => message.$object === id
      )
    )
    .sort()

// Example of use:
// import store from 'store'
// const object = getObject(store.getState(), objectId)
// ...
export const getObject = createGetObject((_, id) => id)

export const createDoesHostNeedRestart = hostSelector => {
  const patchRequiresReboot = createGetObjectsOfType('patch')
    .pick(create(hostSelector, host => host.patches))
    .find(
      create(
        hostSelector,
        host =>
          ({ guidance, time, upgrade }) =>
            time > host.startTime &&
            (upgrade || some(guidance, action => action === 'restartHost' || action === 'restartXapi'))
      )
    )

  return create(
    hostSelector,
    (...args) => args,
    (host, args) => host.rebootRequired || !!patchRequiresReboot(...args)
  )
}

export const createGetHostMetrics = hostSelector =>
  create(
    hostSelector,
    _createCollectionWrapper(hosts => {
      const metrics = {
        count: 0,
        cpus: 0,
        memoryTotal: 0,
        memoryUsage: 0,
      }
      forEach(hosts, host => {
        metrics.count++
        metrics.cpus += host.cpus.cores
        metrics.memoryTotal += host.memory.size
        metrics.memoryUsage += host.memory.usage
      })
      return metrics
    })
  )

export const createGetVmDisks = vmSelector =>
  createGetObjectsOfType('VDI').pick(
    create(
      createGetObjectsOfType('VBD').pick((state, props) => vmSelector(state, props).$VBDs),
      _createCollectionWrapper(vbds => map(vbds, vbd => (vbd.is_cd_drive ? undefined : vbd.VDI)))
    )
  )

export const getIsPoolAdmin = create(
  create(createGetObjectsOfType('pool'), _createCollectionWrapper(Object.keys)),
  getCheckPermissions,
  (poolsIds, check) => some(poolsIds, poolId => check(poolId, 'administrate'))
)

export const getLoneSnapshots = create(
  create(
    createFilter(createGetObjectsOfType('VM-snapshot'), [({ other }) => other['xo:backup:job'] !== undefined]),
    backupSnapshots =>
      map(backupSnapshots, snapshot => {
        const other = snapshot.other
        return {
          ...snapshot,
          jobId: other['xo:backup:job'],
          vmId: other['xo:backup:vm'],
          scheduleId: other['xo:backup:schedule'],
        }
      })
  ),
  _createCollectionWrapper((_, { jobs }) => (jobs === undefined ? undefined : keyBy(jobs, 'id'))),
  _createCollectionWrapper((_, { schedules }) => (schedules === undefined ? undefined : keyBy(schedules, 'id'))),
  createGetObjectsOfType('VM'),
  _createCollectionWrapper((snapshots, jobs, schedules, vms) =>
    getDetachedBackupsOrSnapshots(snapshots, { jobs, schedules, vms })
  )
)

const _getResolvedResourceSet = (resourceSet, networks, srs, vms) => {
  if (resourceSet === undefined) {
    return
  }

  const { objects, ...attrs } = resourceSet
  const objectsByType = {}
  const objectsFound = []

  const resolve = (type, _objects) => {
    const resolvedObjects = pick(_objects, objects)
    if (!isEmpty(resolvedObjects)) {
      objectsFound.push(...Object.keys(resolvedObjects))
      objectsByType[type] = Object.values(resolvedObjects)
    }
  }
  resolve('VM-template', vms)
  resolve('SR', srs)
  resolve('network', networks)

  return {
    ...attrs,
    missingObjects: difference(objectsFound, objects),
    objectsByType,
  }
}

export const getResolvedResourceSet = create(
  (_, props) => props.resourceSet,
  createGetObjectsOfType('network'),
  createGetObjectsOfType('SR'),
  createGetObjectsOfType('VM-template'),
  _getResolvedResourceSet
)

export const getResolvedResourceSets = create(
  (_, props) => props.resourceSets,
  createGetObjectsOfType('network'),
  createGetObjectsOfType('SR'),
  createGetObjectsOfType('VM-template'),
  (resourceSets, networks, srs, vms) =>
    map(resourceSets, resourceSet => _getResolvedResourceSet(resourceSet, networks, srs, vms))
)

export const createGetHostState = getHost =>
  create(
    (state, props) => getHost(state, props).power_state,
    (state, props) => getHost(state, props).enabled,
    (state, props) => getHost(state, props).current_operations,
    (powerState, enabled, operations) =>
      powerState !== 'Running' ? powerState : !isEmpty(operations) ? 'Busy' : !enabled ? 'Disabled' : 'Running'
  )

const taskPredicate = obj => !isEmpty(obj.current_operations)
const getLinkedObjectsByTaskRefOrId = create(
  createGetObjectsOfType('pool').filter([taskPredicate]),
  createGetObjectsOfType('host').filter([taskPredicate]),
  createGetObjectsOfType('SR').filter([taskPredicate]),
  createGetObjectsOfType('VDI').filter([taskPredicate]),
  createGetObjectsOfType('VM').filter([taskPredicate]),
  createGetObjectsOfType('network').filter([taskPredicate]),
  getCheckPermissions,
  (pools, hosts, srs, vdis, vms, networks, check) => {
    const linkedObjectsByTaskRefOrId = {}
    const resolveLinkedObjects = obj => {
      if (!check(obj.id, 'view')) {
        return
      }

      Object.keys(obj.current_operations).forEach(task => {
        if (linkedObjectsByTaskRefOrId[task] === undefined) {
          linkedObjectsByTaskRefOrId[task] = []
        }
        linkedObjectsByTaskRefOrId[task].push(obj)
      })
    }

    forOwn(pools, resolveLinkedObjects)
    forOwn(hosts, resolveLinkedObjects)
    forOwn(srs, resolveLinkedObjects)
    forOwn(vdis, resolveLinkedObjects)
    forOwn(vms, resolveLinkedObjects)
    forOwn(networks, resolveLinkedObjects)

    return linkedObjectsByTaskRefOrId
  }
)

export const getResolvedPendingTasks = create(
  createGetObjectsOfType('task').filter([task => task.status === 'pending']),
  getLinkedObjectsByTaskRefOrId,
  getCheckPermissions,
  (tasks, linkedObjectsByTaskRefOrId, check) => {
    const resolvedTasks = []
    forEach(tasks, task => {
      const objects = [
        ...defined(linkedObjectsByTaskRefOrId[task.xapiRef], []),
        // for VMs, the current_operations prop is
        // { taskId → operation } map instead of { taskRef → operation } map
        ...defined(linkedObjectsByTaskRefOrId[task.id], []),
      ]

      if (objects.length > 0 || check(task.$host, 'view')) {
        resolvedTasks.push({
          ...task,
          objects,
        })
      }
    })
    return resolvedTasks
  }
)
