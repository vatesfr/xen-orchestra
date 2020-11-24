const PARSE_UUID_RE = /-/g

export const packUuid = uuid => Buffer.from(uuid.replace(PARSE_UUID_RE, ''), 'hex')
