// import isFinite from 'lodash/isFinite'
import camelCase from 'lodash/camelCase'
import createDebug from 'debug'
import isEqual from 'lodash/isEqual'
import isPlainObject from 'lodash/isPlainObject'
import pickBy from 'lodash/pickBy'
import { utcFormat, utcParse } from 'd3-time-format'
import { satisfies as versionSatisfies } from 'semver'

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
  mapFilter,
  mapToArray,
  noop
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
          limits[spec.limitName] = addToLimits(value, current)
        }
      }

      const cb = () => spec.set.call(context, value, object)

      const { constraints } = spec
      if (constraints) {
        const cbs = []

        forEach(constraints, (constraint, constraintName) => {
          // Before setting a property to a new value, if the constraint check fails (e.g. memoryMin > memoryMax):
          //    - if the user wants to set the constraint (ie constraintNewValue is defined):
          //        constraint <-- constraintNewValue THEN property <-- value (e.g. memoryMax <-- 2048 THEN memoryMin <-- 1024)
          //    - if the user DOES NOT want to set the constraint (ie constraintNewValue is NOT defined):
          //        constraint <-- value THEN property <-- value (e.g. memoryMax <-- 1024 THEN memoryMin <-- 1024)
          // FIXME: Some values combinations will lead to setting the same property twice, which is not perfect but works for now.
          const constraintCurrentValue = specs[constraintName].get(object)
          const constraintNewValue = values[constraintName]

          if (!constraint(constraintCurrentValue, value)) {
            const cb = set(constraintNewValue == null ? value : constraintNewValue, constraintName)
            if (cb) {
              cbs.push(cb)
            }
          }
        })

        if (cbs.length) {
          return () => Promise.all(mapToArray(cbs, cb => cb())).then(cb)
        }
      }

      return cb
    }

    const cbs = mapFilter(values, set)

    if (checkLimits) {
      await checkLimits(limits, object)
    }

    return Promise.all(mapToArray(cbs, cb => cb())).then(noop)
  }
}

// ===================================================================

export const NULL_REF = 'OpaqueRef:NULL'

// ===================================================================

export const useUpdateSystem = host => {
  // Match Xen Center's condition: https://github.com/xenserver/xenadmin/blob/f3a64fc54bbff239ca6f285406d9034f57537d64/XenModel/Utils/Helpers.cs#L420
  return versionSatisfies(host.software_version.platform_version, '^2.1.1')
}

export const canSrHaveNewVdiOfSize = (sr, minSize) =>
  sr != null && sr.content_type === 'user' && sr.physical_size - sr.physical_utilisation >= minSize
