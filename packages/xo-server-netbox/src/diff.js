import { isEmpty } from 'lodash'

import { compareNames } from './name-dedup'

// Deeply compares 2 objects and returns an object representing the difference
// between the 2 objects. Returns undefined if the 2 objects are equal.
// In Netbox context: properly ignores differences found in names that could be
// due to name deduplication. e.g.: "foo" and "foo (2)" are considered equal.
export default function diff(newer, older) {
  if (typeof newer !== 'object') {
    return newer === older ? undefined : newer
  }

  newer = { ...newer }
  Object.keys(newer).forEach(key => {
    if ((key === 'name' && compareNames(newer[key], older[key])) || diff(newer[key], older?.[key]) === undefined) {
      delete newer[key]
    }
  })

  return isEmpty(newer) ? undefined : newer
}
