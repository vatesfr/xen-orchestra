// import isFinite from 'lodash/isFinite.js'
import camelCase from 'lodash/camelCase.js'
import isEqual from 'lodash/isEqual.js'
import isPlainObject from 'lodash/isPlainObject.js'
import pickBy from 'lodash/pickBy.js'
import semver from 'semver'

import { camelToSnakeCase, forEach, isInteger, map, mapFilter, noop } from '../utils.mjs'

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

export const optional = (value, fn) => (value == null ? undefined : fn ? fn(value) : value)

export const prepareXapiParam = param => {
  // if (isFinite(param) && !isInteger(param)) {
  //   return asFloat(param)
  // }
  if (isInteger(param)) {
    return asInteger(param)
  }
  if (typeof param === 'boolean') {
    return asBoolean(param)
  }
  if (Array.isArray(param)) {
    return map(param, prepareXapiParam)
  }
  if (isPlainObject(param)) {
    return map(filterUndefineds(param), prepareXapiParam)
  }

  return param
}

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

export const isHostRunning = host => {
  const { $metrics } = host

  return $metrics && $metrics.live
}

// -------------------------------------------------------------------

export const getVmDomainType = vm => {
  const dt = vm.domain_type
  if (
    dt !== undefined && // XS < 7.5
    dt !== 'unspecified' // detection failed
  ) {
    return dt
  }
  return vm.HVM_boot_policy === '' ? 'pv' : 'hvm'
}

export const isVmHvm = vm => getVmDomainType(vm) === 'hvm'

const VM_RUNNING_POWER_STATES = {
  Running: true,
  Paused: true,
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

    if (typeof get === 'string') {
      return object => object[get]
    }

    return get
  }
  const normalizeSet = (set, name) => {
    if (typeof set === 'function') {
      return set
    }

    if (set === true) {
      const prop = camelToSnakeCase(name)
      return function (value, obj) {
        return this.setField(obj.$type, obj.$ref, prop, value)
      }
    }

    if (typeof set === 'string') {
      const index = set.indexOf('.')
      if (index === -1) {
        const prop = camelToSnakeCase(set)
        return function (value, obj) {
          return this.setField(obj.$type, obj.$ref, prop, value)
        }
      }

      const field = set.slice(0, index)
      const entry = set.slice(index + 1)

      return function (value, object) {
        return this.setFieldEntry(object.$type, object.$ref, field, entry, value)
      }
    }

    if (!Array.isArray(set)) {
      throw new Error('must be an array, a function or a string')
    }

    set = set.map(normalizeSet)

    const { length } = set
    if (!length) {
      throw new Error('invalid setter')
    }

    if (length === 1) {
      return set[0]
    }

    return function (value, object) {
      return Promise.all(set.map(set => set.call(this, value, object)))
    }
  }

  const normalizeSpec = (spec, name) => {
    if (spec === true) {
      spec = {
        get: true,
        set: true,
      }
    }

    if (spec.addToLimits === true) {
      spec.addToLimits = _DEFAULT_ADD_TO_LIMITS
    }
    if (!spec.limitName) {
      spec.limitName = name
    }

    forEach(spec.constraints, (constraint, constraintName) => {
      if (typeof constraint !== 'function') {
        throw new Error('constraint must be a function')
      }

      const constraintSpec = specs[constraintName]
      if (!constraintSpec.get) {
        throw new Error('constraint values must have a get')
      }
    })

    if ('dispatch' in spec) {
      return spec
    }

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
    typeof spec === 'string' || (specs[name] = normalizeSpec(spec, name))
  })

  // Resolves aliases and add camelCase and snake_case aliases.
  forEach(specs, (spec, name) => {
    if (typeof spec === 'string') {
      do {
        spec = specs[spec]
      } while (typeof spec === 'string')
      specs[name] = spec
    }

    let tmp
    specs[(tmp = camelCase(name))] || (specs[tmp] = spec)
    specs[(tmp = camelToSnakeCase(name))] || (specs[tmp] = spec)
  })

  return async function _editObject_(id, values, checkLimits) {
    const limits = checkLimits && {}
    const object = this.getObject(id)

    const set = (value, name) => {
      if (value === undefined) {
        return
      }

      const spec = specs[name]
      if (!spec) {
        return
      }

      const { dispatch } = spec
      if (dispatch) {
        return set(value, dispatch(object))
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

      const cb = () => spec.set.call(this, value, object)

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
          return () => Promise.all(cbs.map(cb => cb())).then(cb)
        }
      }

      return cb
    }

    const cbs = mapFilter(values, set)

    if (checkLimits) {
      await checkLimits(limits, object)
    }

    return Promise.all(cbs.map(cb => cb())).then(noop)
  }
}

// ===================================================================

export const useUpdateSystem = host => {
  // Match Xen Center's condition: https://github.com/xenserver/xenadmin/blob/f3a64fc54bbff239ca6f285406d9034f57537d64/XenModel/Utils/Helpers.cs#L420
  return semver.satisfies(host.software_version.platform_version, '>=2.1.1')
}

export const canSrHaveNewVdiOfSize = (sr, minSize) =>
  sr != null &&
  // content_type values are not documented: this may be incorrect
  sr.content_type !== 'disk' && // removable
  sr.content_type !== 'iso' && // read only
  sr.physical_size - sr.physical_utilisation >= minSize
