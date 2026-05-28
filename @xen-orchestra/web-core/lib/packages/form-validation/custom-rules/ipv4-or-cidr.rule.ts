import { createRule, type Maybe } from '@regle/core'
import { isFilled } from '@regle/rules'

const IPV4_OCTET = '(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)'
const IPV4_CIDR_PREFIX = '(3[0-2]|[12]?\\d)'
const IP_OR_CIDR_REGEX = new RegExp(`^${IPV4_OCTET}(\\.${IPV4_OCTET}){3}(/${IPV4_CIDR_PREFIX})?$`)

export const ipv4OrCidr = createRule({
  validator(value: Maybe<string>) {
    if (!isFilled(value)) {
      return true
    }

    return IP_OR_CIDR_REGEX.test(value.trim())
  },
  message: 'Invalid IP address',
})
