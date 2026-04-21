import assert from 'node:assert'

export const XAPI_PRIMITIVE_TYPES_MAP = {
  string: 'TEXT',
  int: 'INT8', // 64 bits
  float: 'FLOAT4',
  bool: 'BOOL',
  datetime: 'TIMESTAMPTZ',
}
export const XAPI_PRIMITIVE_TYPES = new Set(Object.keys(XAPI_PRIMITIVE_TYPES_MAP))
export const UUID_TYPE = 'VARCHAR(40)'
export const TOKEN_TYPE = 'VARCHAR(42)'
// very rarely used
export const REF_TYPE = 'VARCHAR(50)'
export const VARCHAR_255 = 'VARCHAR(255)'
export const JSON_TYPE = 'JSON'

// simple types are primitive or enum
export function isSimpleType(xapiType) {
  xapiType = unwrapOption(xapiType)
  return isEnumType(xapiType) || XAPI_PRIMITIVE_TYPES.has(xapiType)
}

export function convertSimpleType(xapiType) {
  xapiType = unwrapOption(xapiType)
  return XAPI_PRIMITIVE_TYPES_MAP[xapiType] || VARCHAR_255
}

export function isEnumType(xapiType) {
  const fragments = xapiType.split(' ')
  return fragments.length === 2 && fragments[0] === 'enum'
}

// type might be complex but contains no embedded ref
export function isNonRef(xapiType) {
  xapiType = unwrapOption(xapiType)
  if (unwrapRecord(xapiType)) {
    return false
  }
  if (isSimpleType(xapiType)) return true
  const map = splitMapType(xapiType)
  if (map) {
    return isNonRef(map[0]) && isNonRef(map[1])
  }
  const set = unwrapSet(xapiType)
  if (set) {
    return isNonRef(set)
  }
  return !xapiType.endsWith(' ref')
}

/** T record is an indirect ref but is not stored in DB */
export function isStorableRef(xapiType) {
  xapiType = unwrapOption(xapiType)
  if (unwrapRecord(xapiType)) {
    return false
  }
  if (!isNonRef(xapiType)) {
    if (splitMapType(xapiType)) {
      return isSupportedMapType(xapiType)
    }
    return !!getRefFromType(xapiType)
  }
  return false
}

/**
 * We want the key to be a simple type or a direct reference to avoid comparison issues.
 * We want the value to be either a direct ref or any non ref type, we'll store it as json.
 */
export function isSupportedMapType(xapiType) {
  const mapType = splitMapType(xapiType)
  if (!mapType) return false
  const [kType, vType] = mapType

  if (isSimpleType(kType)) {
    return unwrapDirectRef(vType) || isNonRef(vType)
  }
  if (unwrapDirectRef(kType)) {
    return isNonRef(vType)
  }
  return false
}

/** return the set element type or null if type is not a set
 * @param {string} xapiType
 * @returns {null|string}
 */
export function unwrapSet(xapiType) {
  const split = xapiType.split(' ')
  if (split.at(-1) === 'set') {
    return split.slice(0, -1).join(' ')
  }
  return null
}

/**
 "(int -> string set) map" => [ 'int', 'string set' ]
 */
export function splitMapType(xapiType) {
  if (xapiType.endsWith(') map')) {
    const unwrapped = xapiType.substring(1, xapiType.length - 5)
    return unwrapped.split(' -> ')
  }
  return null
}

/** unwrap "T option" to "T"  or returns the input */
export function unwrapOption(xapiType) {
  const split = xapiType.split(' ')
  if (split[split.length - 1] === 'option') {
    return split.slice(0, -1).join(' ')
  }
  return xapiType
}

/** unwrap "T record" to "T"  or returns the input */
export function unwrapRecord(xapiType) {
  const split = xapiType.split(' ')
  if (split[split.length - 1] === 'record') {
    return split.slice(0, -1).join(' ')
  }
  return null
}

// unwrap "T ref" to "T"  or return null
export function unwrapDirectRef(xapiType) {
  const split = xapiType.split(' ')
  if (split[split.length - 1] === 'ref') {
    return split.slice(0, -1).join(' ')
  }
  return null
}

// return the first reference found in a complex type or null
export function getRefFromType(xapiType) {
  const unwrapped = unwrapDirectRef(xapiType)
  if (unwrapped) {
    return unwrapped
  }
  const unwrappedSet = unwrapSet(xapiType)
  if (unwrappedSet) {
    return getRefFromType(unwrappedSet)
  }
  const splitMap = splitMapType(xapiType)
  if (splitMap) {
    const [k, v] = splitMap
    return getRefFromType(k) || getRefFromType(v)
  }
  return null
}

/**
 *
 * @param {string} xapiTimestamp
 * @return {string}
 */
export function datetimeXapi2Db(xapiTimestamp) {
  // xapi example:  '20200903T20:50:13Z'
  // JS requirement: '2020-09-03 20:50:13.000z'
  return (
    xapiTimestamp.slice(0, 4) +
    '-' +
    xapiTimestamp.slice(4, 6) +
    '-' +
    xapiTimestamp.slice(6, 8) +
    ' ' +
    xapiTimestamp.slice(9)
  )
}

/**
 *
 * @param {Date} dbTimestamp
 * @return {string}
 */
export function datetimeDb2Xapi(dbTimestamp) {
  // xapi example:  '20200903T20:50:13Z'
  // JS requirement: '2020-09-03 20:50:13.000z'
  const msResult = dbTimestamp.toISOString().replaceAll('-', '').replace(' ', 'T').toUpperCase()
  return msResult.replace(/\.\d{3}Z$/, 'Z')
}

export const ident = v => v

const IDENT_CONVERTER = [ident, ident]
export const PRIMITIVE_TYPE_CONVERTERS = {
  string: IDENT_CONVERTER,
  int: IDENT_CONVERTER,
  float: IDENT_CONVERTER,
  bool: IDENT_CONVERTER,
  datetime: [datetimeXapi2Db, datetimeDb2Xapi],
}

export function converterForSimpleType(xapiType) {
  assert.ok(isSimpleType(xapiType), xapiType)
  return xapiType in PRIMITIVE_TYPE_CONVERTERS ? PRIMITIVE_TYPE_CONVERTERS[xapiType] : IDENT_CONVERTER
}

export function isSupportedSetType(xapiType) {
  const setContent = unwrapSet(xapiType)
  return setContent && !!unwrapDirectRef(setContent)
}
