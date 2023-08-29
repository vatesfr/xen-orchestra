const PARSE_UUID_RE = /-/g

export function packUuid(uuid) {
  return Buffer.from(uuid.replace(PARSE_UUID_RE, ''), 'hex')
}
