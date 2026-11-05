import { createRule, type Maybe } from '@regle/core'
import { isFilled } from '@regle/rules'
import { IPV4_ADDRESS, IPV4_CIDR_PREFIX } from './ip.regex.ts'

const IP_OR_CIDR_REGEX = new RegExp(`^${IPV4_ADDRESS}(/${IPV4_CIDR_PREFIX})?$`)

export const ipv4OrCidr = createRule({
  validator(value: Maybe<string>) {
    if (!isFilled(value)) {
      return true
    }

    return IP_OR_CIDR_REGEX.test(value.trim())
  },
  message: 'Invalid IP address',
})
