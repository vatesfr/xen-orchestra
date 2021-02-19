const PARSE_UUID_RE = /-/g

const packUuid = uuid => Buffer.from(uuid.replace(PARSE_UUID_RE, ''), 'hex')

exports.packUuid = packUuid
