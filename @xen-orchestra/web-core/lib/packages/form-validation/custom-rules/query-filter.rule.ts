import { createRule, type Maybe } from '@regle/core'
import { isFilled } from '@regle/rules'
import { parse } from 'complex-matcher'

export const queryFilter = createRule({
  validator(value: Maybe<string>) {
    if (!isFilled(value)) {
      return true
    }

    try {
      parse(value)

      return true
    } catch {
      return false
    }
  },
  message: 'Invalid query',
})
