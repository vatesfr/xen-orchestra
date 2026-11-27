import { isEqual } from 'lodash-es'

// Returns `previous` when `next` is deeply equal to it: a computed returning it then doesn't trigger its dependents
export function keepIfEqual<T>(previous: T | undefined, next: T): T {
  return previous !== undefined && isEqual(previous, next) ? previous : next
}
