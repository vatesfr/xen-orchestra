const IPV4_OCTET = '(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)'

const V6_SEGMENT = '[0-9a-fA-F]{1,4}'

export const IPV4_ADDRESS = `${IPV4_OCTET}(\\.${IPV4_OCTET}){3}`

export const IPV4_CIDR_PREFIX = '(3[0-2]|[12]?\\d)'

export const IPV4_REGEX = new RegExp(`^${IPV4_ADDRESS}$`)

export const IPV6_REGEX = new RegExp(
  '^(' +
    `(${V6_SEGMENT}:){7}${V6_SEGMENT}|` +
    `(${V6_SEGMENT}:){1,7}:|` +
    `(${V6_SEGMENT}:){1,6}:${V6_SEGMENT}|` +
    `(${V6_SEGMENT}:){1,5}(:${V6_SEGMENT}){1,2}|` +
    `(${V6_SEGMENT}:){1,4}(:${V6_SEGMENT}){1,3}|` +
    `(${V6_SEGMENT}:){1,3}(:${V6_SEGMENT}){1,4}|` +
    `(${V6_SEGMENT}:){1,2}(:${V6_SEGMENT}){1,5}|` +
    `${V6_SEGMENT}:(:${V6_SEGMENT}){1,6}|` +
    `:((:${V6_SEGMENT}){1,7}|:)|` +
    `fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]+|` +
    `::(ffff(:0{1,4})?:)?${IPV4_ADDRESS}|` +
    `(${V6_SEGMENT}:){1,4}:${IPV4_ADDRESS}` +
    ')$'
)
