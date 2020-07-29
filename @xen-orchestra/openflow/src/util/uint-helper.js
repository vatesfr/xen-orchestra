const ZERO = 0x00000000
const ALL = 0xffffffff

// =============================================================================

export default {
  isUInt64None: n => n[0] === ZERO && n[1] === ZERO,

  isUInt64All: n => n[0] === ALL && n[1] === ALL,
}
