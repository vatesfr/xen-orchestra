// import isFinite from 'lodash/isFinite'
import camelCase from 'lodash/camelCase'
import createDebug from 'debug'
import isEqual from 'lodash/isEqual'
import isPlainObject from 'lodash/isPlainObject'
import pickBy from 'lodash/pickBy'
import { utcFormat, utcParse } from 'd3-time-format'

import httpRequest from '../http-request'
import {
  camelToSnakeCase,
  createRawObject,
  forEach,
  isArray,
  isBoolean,
  isFunction,
  isInteger,
  isString,
  map,
  mapToArray,
  noop,
  pFinally
} from '../utils'

// ===================================================================

export const asBoolean = value => Boolean(value)

// const asFloat = value => {
//   value = String(value)
//   return value.indexOf('.') === -1
//     ? `${value}.0`
//     : value
// }

export const asInteger = value => String(value)

export const filterUndefineds = obj => pickBy(obj, value => value !== undefined)

export const optional = (value, fn) => value == null
  ? undefined
  : fn ? fn(value) : value

export const prepareXapiParam = param => {
  // if (isFinite(param) && !isInteger(param)) {
  //   return asFloat(param)
  // }
  if (isInteger(param)) {
    return asInteger(param)
  }
  if (isBoolean(param)) {
    return asBoolean(param)
  }
  if (isArray(param)) {
    return map(param, prepareXapiParam)
  }
  if (isPlainObject(param)) {
    return map(filterUndefineds(param), prepareXapiParam)
  }

  return param
}

// -------------------------------------------------------------------

export const debug = createDebug('xo:xapi')

// -------------------------------------------------------------------

const OPAQUE_REF_RE = /OpaqueRef:[0-9a-z-]+/
export const extractOpaqueRef = str => {
  const matches = OPAQUE_REF_RE.exec(str)
  if (!matches) {
    throw new Error('no opaque ref found')
  }
  return matches[0]
}

// -------------------------------------------------------------------

const TYPE_TO_NAMESPACE = createRawObject()
forEach([
  'Bond',
  'DR_task',
  'GPU_group',
  'PBD',
  'PCI',
  'PGPU',
  'PIF',
  'PIF_metrics',
  'SM',
  'SR',
  'VBD',
  'VBD_metrics',
  'VDI',
  'VGPU',
  'VGPU_type',
  'VIF',
  'VLAN',
  'VM',
  'VM_appliance',
  'VM_guest_metrics',
  'VM_metrics',
  'VMPP',
  'VTPM'
], namespace => {
  TYPE_TO_NAMESPACE[namespace.toLowerCase()] = namespace
})

// Object types given by `xen-api` are always lowercase but the
// namespaces in the Xen API can have a different casing.
export const getNamespaceForType = type => TYPE_TO_NAMESPACE[type] || type

// -------------------------------------------------------------------

// Format a date (pseudo ISO 8601) from one XenServer get by
// xapi.call('host.get_servertime', host.$ref) for example
export const formatDateTime = utcFormat('%Y%m%dT%H:%M:%SZ')

export const parseDateTime = utcParse('%Y%m%dT%H:%M:%SZ')

// -------------------------------------------------------------------

export const isHostRunning = host => {
  const { $metrics } = host

  return $metrics && $metrics.live
}

// -------------------------------------------------------------------

export const isVmHvm = vm => Boolean(vm.HVM_boot_policy)

const VM_RUNNING_POWER_STATES = {
  Running: true,
  Paused: true
}
export const isVmRunning = vm => VM_RUNNING_POWER_STATES[vm.power_state]

// -------------------------------------------------------------------

const _DEFAULT_ADD_TO_LIMITS = (next, current) => next - current

const _mapFilter = (collection, iteratee) => {
  const result = []
  forEach(collection, (...args) => {
    const value = iteratee(...args)
    if (value) {
      result.push(value)
    }
  })
  return result
}

export const makeEditObject = specs => {
  const normalizeGet = (get, name) => {
    if (get === true) {
      const prop = camelToSnakeCase(name)
      return object => object[prop]
    }

    if (isString(get)) {
      return object => object[get]
    }

    return get
  }
  const normalizeSet = (set, name) => {
    if (isFunction(set)) {
      return set
    }

    if (set === true) {
      const prop = camelToSnakeCase(name)
      return function (value) {
        return this._set(prop, value)
      }
    }

    if (isString(set)) {
      const index = set.indexOf('.')
      if (index === -1) {
        const prop = camelToSnakeCase(set)
        return function (value) {
          return this._set(prop, value)
        }
      }

      const map = set.slice(0, index)
      const prop = set.slice(index + 1)

      return function (value, object) {
        return this._updateObjectMapProperty(object, map, { [prop]: value })
      }
    }

    if (!isArray(set)) {
      throw new Error('must be an array, a function or a string')
    }

    set = mapToArray(set, normalizeSet)

    const { length } = set
    if (!length) {
      throw new Error('invalid setter')
    }

    if (length === 1) {
      return set[0]
    }

    return function (value, object) {
      return Promise.all(mapToArray(set, set => set.call(this, value, object)))
    }
  }

  const normalizeSpec = (spec, name) => {
    if (spec === true) {
      spec = {
        get: true,
        set: true
      }
    }

    if (spec.addToLimits === true) {
      spec.addToLimits = _DEFAULT_ADD_TO_LIMITS
    }
    if (!spec.limitName) {
      spec.limitName = name
    }

    forEach(spec.constraints, (constraint, constraintName) => {
      if (!isFunction(constraint)) {
        throw new Error('constraint must be a function')
      }

      const constraintSpec = specs[constraintName]
      if (!constraintSpec.get) {
        throw new Error('constraint values must have a get')
      }
    })

    const { get } = spec
    if (get) {
      spec.get = normalizeGet(get, name)
    } else if (spec.addToLimits) {
      throw new Error('addToLimits cannot be defined without get')
    }

    spec.set = normalizeSet(spec.set, name)

    return spec
  }
  forEach(specs, (spec, name) => {
    isString(spec) || (specs[name] = normalizeSpec(spec, name))
  })

  // Resolves aliases and add camelCase and snake_case aliases.
  forEach(specs, (spec, name) => {
    if (isString(spec)) {
      do {
        spec = specs[spec]
      } while (isString(spec))
      specs[name] = spec
    }

    let tmp
    specs[tmp = camelCase(name)] || (specs[tmp] = spec)
    specs[tmp = camelToSnakeCase(name)] || (specs[tmp] = spec)
  })

  return async function _editObject_ (id, values, checkLimits) {
    const limits = checkLimits && {}
    const object = this.getObject(id)

    const _objectRef = object.$ref
    const _setMethodPrefix = `${getNamespaceForType(object.$type)}.set_`

    // Context used to execute functions.
    const context = {
      __proto__: this,
      _set: (prop, value) => this.call(_setMethodPrefix + prop, _objectRef, prepareXapiParam(value))
    }

    const set = (value, name) => {
      if (value === undefined) {
        return
      }

      const spec = specs[name]
      if (!spec) {
        return
      }

      const { preprocess } = spec
      if (preprocess) {
        value = preprocess(value)
      }

      const { get } = spec
      if (get) {
        const current = get(object)
        if (isEqual(value, current)) {
          return
        }

        let addToLimits
        if (limits && (addToLimits = spec.addToLimits)) {
          console.log(spec.limitName, value, current, addToLimits(value, current))
          limits[spec.limitName] = addToLimits(value, current)
        }
      }

      const cb = () => spec.set.call(context, value, object)

      const { constraints } = spec
      if (constraints) {
        const cbs = []

        forEach(constraints, (constraint, constraintName) => {
          // This constraint value is already defined: bypass the constraint.
          if (values[constraintName] != null) {
            return
          }

          if (!constraint(specs[constraintName].get(object), value)) {
            const cb = set(value, constraintName)
            cbs.push(cb)
          }
        })

        if (cbs.length) {
          return () => Promise.all(mapToArray(cbs, cb => cb())).then(cb)
        }
      }

      return cb
    }

    const cbs = _mapFilter(values, set)

    if (checkLimits) {
      await checkLimits(limits, object)
    }

    return Promise.all(mapToArray(cbs, cb => cb())).then(noop)
  }
}

// ===================================================================

// HTTP put, use an ugly hack if the length is not known because XAPI
// does not support chunk encoding.
export const put = (stream, {
  headers: { ...headers } = {},
  ...opts
}, task) => {
  const makeRequest = () => httpRequest({
    ...opts,
    body: stream,
    headers,
    method: 'put'
  })

  // Xen API does not support chunk encoding.
  if (stream.length == null) {
    headers['transfer-encoding'] = null

    const promise = makeRequest()

    if (task) {
      // Some connections need the task to resolve (VDI import).
      task::pFinally(() => {
        promise.cancel()
      })
    } else {
      // Some tasks need the connection to close (VM import).
      promise.request.once('finish', () => {
        promise.cancel()
      })
    }

    return promise.readAll()
  }

  return makeRequest().readAll()
}
