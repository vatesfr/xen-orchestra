import { createLogger } from '@xen-orchestra/log'

const { debug } = createLogger('xo:xapi:propertyFilter')

// VM.platform:hvm_serial, same format as Xva#removeKeys() in @xen-orchestra/xva
const FILTERED_PROPERTY_RE = /^([^.:]+)\.([^.:]+):(.+)$/

// VM.create, VM.set_platform, Async.VM.add_to_other_config
const WRITE_METHOD_RE = /^(Async\.)?([^.]+)\.(?:(create)|set_(.+)|add_to_(.+))$/

const isMap = value => value !== null && typeof value === 'object' && !Array.isArray(value)

/**
 * filter keys out of the map fields of xapi records, e.g. 'VM.platform:hvm_serial' filters the key
 * hvm_serial of the platform field of the VMs
 *
 * the key is matched case-insensitively
 */
export class PropertyFilter {
  // lower cased keys by field by class: #keys.VM.platform = Set { 'hvm_serial' }
  #keys = {}

  /**
   * @param {ReadonlyArray<string>} [filteredProperties] as 'Class.field:key'
   */
  constructor(filteredProperties = []) {
    for (const filteredProperty of filteredProperties) {
      const match = FILTERED_PROPERTY_RE.exec(filteredProperty)
      if (match === null) {
        throw new Error(`invalid filtered property ${filteredProperty}, expected Class.field:key`)
      }
      const [, type, field, key] = match
      const fields = this.#keys[type] ?? (this.#keys[type] = {})
      const keys = fields[field] ?? (fields[field] = new Set())
      keys.add(key.toLowerCase())
    }
  }

  /**
   * @param {string} type
   * @param {string} field
   * @param {string} key
   * @returns {boolean}
   */
  isFiltered(type, field, key) {
    return this.#keys[type]?.[field]?.has(String(key).toLowerCase()) ?? false
  }

  /**
   * @template T
   * @param {string} type
   * @param {string} field
   * @param {T} value the value of the field
   * @returns {T} value without the filtered keys, value itself if there is nothing to filter
   */
  filterField(type, field, value) {
    if (this.#keys[type]?.[field] === undefined || !isMap(value)) {
      return value
    }
    const filteredKeys = Object.keys(value).filter(key => this.isFiltered(type, field, key))
    if (filteredKeys.length === 0) {
      return value
    }
    debug('filtering properties', { type, field, keys: filteredKeys })
    const filtered = { ...value }
    for (const key of filteredKeys) {
      delete filtered[key]
    }
    return filtered
  }

  /**
   * @template {Record<string, unknown>} T
   * @param {string} type
   * @param {T} record fields of an object of this type
   * @returns {T} record without the filtered keys, record itself if there is nothing to filter
   */
  filterRecord(type, record) {
    const fields = this.#keys[type]
    if (fields === undefined) {
      return record
    }
    const filtered = { ...record }
    for (const field of Object.keys(fields)) {
      if (field in record) {
        filtered[field] = this.filterField(type, field, record[field])
      }
    }
    return filtered
  }

  /**
   * filter the params of a xapi call writing map fields: Class.create(record), Class.set_field(ref, value) and
   * Class.add_to_field(ref, key, value)
   *
   * @param {string} method name of the xapi method, with its Async. prefix if any
   * @param {ReadonlyArray<unknown>} params params of the call, without the session id
   * @returns {ReadonlyArray<unknown> | undefined} the params to use, undefined if the call must not be done
   */
  filterCall(method, params) {
    const match = WRITE_METHOD_RE.exec(method)
    if (match === null) {
      return params
    }
    const [, isAsync, type, isCreate, setField, addToField] = match
    if (this.#keys[type] === undefined) {
      return params
    }
    if (isCreate !== undefined) {
      const [record, ...rest] = params
      return isMap(record) ? [this.filterRecord(type, record), ...rest] : params
    }
    if (setField !== undefined) {
      const [ref, value, ...rest] = params
      return [ref, this.filterField(type, setField, value), ...rest]
    }
    if (!this.isFiltered(type, addToField, params[1])) {
      return params
    }
    if (isAsync !== undefined) {
      // a task ref is expected, the call can't be silently skipped
      throw new Error(`${method}: the key ${params[1]} is filtered`)
    }
    debug('filtering property', { type, field: addToField, key: params[1] })
  }
}
