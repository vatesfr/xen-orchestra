const assert = require('assert')
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

class Xapi extends Base {
  constructor({ maxUncoalescedVdis, ...opts }) {
    super(opts)
    this._maxUncoalescedVdis = maxUncoalescedVdis
  }
}
function mixin(mixins) {
  const xapiProto = Xapi.prototype
  const {
    defineProperties,
    getOwnPropertyDescriptor,
    getOwnPropertyNames,
  } = Object
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
