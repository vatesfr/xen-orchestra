export function isNotEmptyRef(val) {
  const EMPTY = 'OpaqueRef:NULL'
  const PREFIX = 'OpaqueRef:'
  return val !== EMPTY && typeof val === 'string' && val.startsWith(PREFIX)
}
