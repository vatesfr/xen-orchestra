// Port of Xapi#_wrapRecord from packages/xen-api/index.mjs (~line 1641).
//
// This is the piece that turns a raw XAPI record into the enriched object
// xapi-object-to-xo expects: `$id` / `$ref` / `$type` / `$pool` / `$xapi`,
// lazy `$<field>` link getters, and the `$call` / `set_*` / `update_*` methods.
//
// Divergences from the original, all mechanical:
//  - a factory over a façade instead of a method on Xapi
//  - `getObjectByRef(ref)` callback instead of indexing `this._objectsByRef`,
//    because XO Lite keeps its records in per-type Map-backed Pinia stores
//  - the `addMethods` prototype walk is dropped: it harvests xo-server's Xapi
//    mixin methods (`VM_start` -> `$start`), which do not exist client-side

import Ref from './Ref.mjs'

const { defineProperties, defineProperty, keys: getKeys } = Object

const noop = () => {}

const RESERVED_FIELDS = {
  id: true,
  pool: true,
  ref: true,
  type: true,
  xapi: true,
}

function getPool() {
  return this.$xapi.pool
}

/**
 * @param {object} xapi - façade: { getObjectByRef, pool, call, callAsync, setField, setFieldEntry, setFieldEntries }
 */
export function createRecordWrapper(xapi) {
  const RecordsByType = { __proto__: null }
  const getObjectByRef = ref => xapi.getObjectByRef(ref)

  return function wrapRecord(type, ref, data) {
    let Record = RecordsByType[type]
    if (Record === undefined) {
      // Divergence: xen-api feeds this straight from `get_all_records`, so the
      // data has no `$ref`. XO Lite's `buildXoObject()` already adds one, and
      // assigning over the non-writable `$ref` defined below throws in strict
      // mode (ESM). Drop the enriched keys before treating the rest as fields.
      const fields = getKeys(data).filter(field => field !== '$ref' && field !== '$id')
      const nFields = fields.length

      Record = defineProperty(
        function (ref, data) {
          defineProperties(this, {
            $id: { value: data.uuid ?? ref, enumerable: false },
            $ref: { value: ref, enumerable: false },
          })
          for (let i = 0; i < nFields; ++i) {
            const field = fields[i]
            this[field] = data[field]
          }
        },
        'name',
        { value: type }
      )

      const getters = { $pool: getPool }
      const props = {
        $call: function (method, ...args) {
          return xapi.call(`${type}.${method}`, this.$ref, ...args)
        },
        $callAsync: function (method, ...args) {
          return xapi.callAsync(`${type}.${method}`, this.$ref, ...args)
        },
        $type: type,
        $xapi: xapi,
      }

      fields.forEach(field => {
        props[`set_${field}`] = function (value) {
          return xapi.setField(this.$type, this.$ref, field, value)
        }

        const $field = (field in RESERVED_FIELDS ? '$$' : '$') + field

        const value = data[field]
        if (Array.isArray(value)) {
          if (value.length === 0 || Ref.is(value[0])) {
            getters[$field] = function () {
              const value = this[field]
              return value.length === 0 ? value : value.map(getObjectByRef)
            }
          }

          props[`add_${field}`] = function (value) {
            return xapi.call(`${type}.add_${field}`, this.$ref, value).then(noop)
          }
          props[`remove_${field}`] = function (value) {
            return xapi.call(`${type}.remove_${field}`, this.$ref, value).then(noop)
          }
        } else if (value !== null && typeof value === 'object') {
          getters[$field] = function () {
            const value = this[field]
            const result = {}
            getKeys(value).forEach(key => {
              result[key] = getObjectByRef(value[key])
            })
            return result
          }
          props[`update_${field}`] = function (entries, value) {
            return typeof entries === 'string'
              ? xapi.setFieldEntry(this.$type, this.$ref, field, entries, value)
              : xapi.setFieldEntries(this.$type, this.$ref, field, entries)
          }
        } else if (Ref.is(value)) {
          getters[$field] = function () {
            return getObjectByRef(this[field])
          }
        }
      })

      const descriptors = {}
      getKeys(getters).forEach(key => {
        descriptors[key] = { configurable: true, enumerable: false, get: getters[key] }
      })
      getKeys(props).forEach(key => {
        descriptors[key] = { configurable: true, enumerable: false, value: props[key], writable: true }
      })
      defineProperties(Record.prototype, descriptors)

      RecordsByType[type] = Record
    }

    return new Record(ref, data)
  }
}
