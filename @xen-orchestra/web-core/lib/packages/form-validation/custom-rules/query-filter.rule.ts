import { isFilterParsable } from '@core/packages/query-builder/filter-string.ts'
import { createRule, type Maybe } from '@regle/core'
import { isFilled } from '@regle/rules'

export const queryFilter = createRule({
  validator(value: Maybe<string>) {
    if (!isFilled(value)) {
      return true
    }

    return isFilterParsable(value)
  },
  message: 'Invalid query',
})
