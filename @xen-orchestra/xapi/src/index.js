const { Xapi: Base } = require('xen-api')

// VDI formats. (Raw is not available for delta vdi.)
exports.VDI_FORMAT_RAW = 'raw'
exports.VDI_FORMAT_VHD = 'vhd'

class Xapi extends Base {}
function mixin(mixins) {
  const xapiProto = Xapi.prototype
  const {
    defineProperty,
    getOwnPropertyDescriptor,
    getOwnPropertyNames,
  } = Object
  Object.keys(mixins).forEach(prefix => {
    const mixinProto = mixins[prefix].prototype
    getOwnPropertyNames(mixinProto)
      .filter(_ => _ !== 'constructor')
      .forEach(name => {
        defineProperty(
          xapiProto,
          `${prefix}_${name}`,
          getOwnPropertyDescriptor(mixinProto, name)
        )
      })
  })
}
mixin({
  sr: require('./sr'),
  task: require('./task'),
  vdi: require('./vdi'),
  vm: require('./vm'),
})
exports.Xapi = Xapi
