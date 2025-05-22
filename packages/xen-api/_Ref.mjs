const EMPTY = 'OpaqueRef:NULL'
const PREFIX = 'OpaqueRef:'

export default {
  // Reference to use to indicate it's not pointing to an object
  EMPTY,

  // Whether this value is a reference (probably) pointing to an object
  isNotEmpty(val) {
    return val !== EMPTY && typeof val === 'string' && val.startsWith(PREFIX)
  },

  // Whether this value looks like a reference
  is(val) {
    return (
      typeof val === 'string' &&
      (val.startsWith(PREFIX) ||
        // 2019-02-07 - JFT: even if `value` should not be an empty string for
        // a ref property, an user had the case on XenServer 7.0 on the CD VBD
        // of a VM created by XenCenter
        val === '' ||
        // 2021-03-08 - JFT: there is a bug in XCP-ng/XenServer which leads to
        // some refs to be `Ref:*` instead of being rewritten
        //
        // We'll consider them as empty refs in this lib to avoid issues with
        // _wrapRecord.
        //
        // See https://github.com/xapi-project/xen-api/issues/4338
        val.startsWith('Ref:'))
    )
  },
}
