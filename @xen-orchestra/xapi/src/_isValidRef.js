const { NULL_REF, isOpaqueRef } = require('xen-api')

module.exports = ref => ref !== NULL_REF && isOpaqueRef(ref)
