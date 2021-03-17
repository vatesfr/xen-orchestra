const assert = require('assert')
const defer = require('promise-toolbox/defer')
const { utcFormat, utcParse } = require('d3-time-format')
const { Xapi: Base } = require('xen-api')

// VDI formats. (Raw is not available for delta vdi.)
exports.VDI_FORMAT_RAW = 'raw'
exports.VDI_FORMAT_VHD = 'vhd'

// Format a date (pseudo ISO 8601) from one XenServer get by
// xapi.call('host.get_servertime', host.$ref) for example
exports.formatDateTime = utcFormat('%Y%m%dT%H:%M:%SZ')

const parseDateTimeHelper = utcParse('%Y%m%dT%H:%M:%SZ')
exports.parseDateTime = function (str, defaultValue) {
  const date = parseDateTimeHelper(str)
  if (date === null) {
    if (arguments.length > 1) {
      return defaultValue
    }
    throw new RangeError(`unable to parse XAPI datetime ${JSON.stringify(str)}`)
  }
  return date.getTime()
}

const hasProps = o => {
  // eslint-disable-next-line no-unreachable-loop
  for (const key in o) {
    return true
  }
  return false
}

class Xapi extends Base {
  constructor({ ignoreNobakVdis, maxUncoalescedVdis, vdiDestroyRetryWhenInUse, ...opts }) {
    assert.notStrictEqual(ignoreNobakVdis, undefined)

    super(opts)
    this._ignoreNobakVdis = ignoreNobakVdis
    this._maxUncoalescedVdis = maxUncoalescedVdis
    this._vdiDestroyRetryWhenInUse = {
      delay: 5e3,
      retries: 10,
      ...vdiDestroyRetryWhenInUse,
    }

    const genericWatchers = (this._genericWatchers = new Set())
    const objectWatchers = (this._objectWatchers = { __proto__: null })

    const onAddOrUpdate = records => {
      if (genericWatchers.size === 0 && !hasProps(objectWatchers)) {
        // no need to process records
        return
      }

      Object.keys(records).forEach(id => {
        const object = records[id]

        genericWatchers.forEach(watcher => {
          watcher(object)
        })

        if (id in objectWatchers) {
          objectWatchers[id].resolve(object)
          delete objectWatchers[id]
        }
        const ref = object.$ref
        if (ref in objectWatchers) {
          objectWatchers[ref].resolve(object)
          delete objectWatchers[ref]
        }
      })
    }
    this.objects.on('add', onAddOrUpdate)
    this.objects.on('update', onAddOrUpdate)
  }

  _waitObject(predicate) {
    if (typeof predicate === 'function') {
      const genericWatchers = this._genericWatchers

      const { promise, resolve } = defer()
      genericWatchers.add(function watcher(obj) {
        if (predicate(obj)) {
          genericWatchers.delete(watcher)
          resolve(obj)
        }
      })
      return promise
    }

    let watcher = this._objectWatchers[predicate]
    if (watcher === undefined) {
      watcher = this._objectWatchers[predicate] = defer()
    }
    return watcher.promise
  }
}
function mixin(mixins) {
  const xapiProto = Xapi.prototype
  const { defineProperties, getOwnPropertyDescriptor, getOwnPropertyNames } = Object
  const descriptors = { __proto__: null }
  Object.keys(mixins).forEach(prefix => {
    const mixinProto = mixins[prefix].prototype
    getOwnPropertyNames(mixinProto)
      .filter(_ => _ !== 'constructor')
      .forEach(name => {
        const key = name[0] === '_' ? name : `${prefix}_${name}`

        assert(!(key in descriptors), `${key} is already defined`)

        descriptors[key] = getOwnPropertyDescriptor(mixinProto, name)
      })
  })
  defineProperties(xapiProto, descriptors)
}
mixin({
  task: require('./task'),
  VBD: require('./vbd'),
  VDI: require('./vdi'),
  VIF: require('./vif'),
  VM: require('./vm'),
})
exports.Xapi = Xapi
