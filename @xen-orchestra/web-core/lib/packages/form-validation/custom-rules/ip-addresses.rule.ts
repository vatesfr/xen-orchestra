import { createRule, type Maybe } from '@regle/core'
import { isFilled } from '@regle/rules'
import { IPV4_REGEX, IPV6_REGEX } from './ip.regex.ts'

export const ipAddresses = createRule({
  validator(value: Maybe<string>, separator: string = ';') {
    if (!isFilled(value)) {
      return true
    }

    return value
      .split(separator)
      .map(ip => ip.trim())
      .filter(ip => ip !== '')
      .every(ip => IPV4_REGEX.test(ip) || IPV6_REGEX.test(ip))
  },
  message: 'One or more invalid IP addresses',
})
