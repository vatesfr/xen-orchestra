import { get, identity } from 'lodash-es'

export function destructSmartPattern(pattern: Record<string, any>, valueTransform = identity) {
  return (
    pattern && {
      values: valueTransform(pattern.__and !== undefined ? pattern.__and[0].__or : pattern.__or),
      notValues: valueTransform(pattern.__and !== undefined ? pattern.__and[1].__not.__or : get(pattern, '__not.__or')),
    }
  )
}
