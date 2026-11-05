import { createRule, type Maybe } from '@regle/core'
import { isFilled } from '@regle/rules'

export const outOfRange = createRule({
  validator(value: Maybe<number>, min: number, max: number) {
    if (!isFilled(value)) {
      return true
    }

    return value >= min && value <= max
  },
  message({ $params: [min, max] }) {
    return `Should be between ${min} and ${max}`
  },
})
