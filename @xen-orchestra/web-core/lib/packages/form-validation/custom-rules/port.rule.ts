import { createRule, type Maybe } from '@regle/core'
import { isFilled } from '@regle/rules'

const MIN_PORT = 1
const MAX_PORT = 65535

export const port = createRule({
  validator(value: Maybe<string>) {
    if (!isFilled(value)) {
      return true
    }

    if (!/^\d+$/.test(value)) {
      return false
    }

    const parsed = Number(value)

    return parsed >= MIN_PORT && parsed <= MAX_PORT
  },
  message: 'Invalid port number',
})
