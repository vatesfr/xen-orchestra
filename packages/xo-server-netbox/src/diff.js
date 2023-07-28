import isEmpty from 'lodash/isEmpty'

import { compareNames } from './name-dedup'

/**
 * Deeply compares 2 objects and returns an object representing the difference
 * between the 2 objects. Returns undefined if the 2 objects are equal.
 * In Netbox context: properly ignores differences found in names that could be
 * due to name deduplication. e.g.: "foo" and "foo (2)" are considered equal.
 * @param {any} newer
 * @param {any} older
 * @returns {Object|undefined} The patch that needs to be applied to older to get newer
 */
export default function diff(newer, older) {
  if (typeof newer !== 'object' || newer === null) {
    return newer === older ? undefined : newer
  }

  // For arrays, they must be exactly the same or we pass the new one entirely
  if (Array.isArray(newer)) {
    if (newer.length !== older.length || newer.some((value, index) => diff(value, older[index]) !== undefined)) {
      return newer
    }

    return
  }

  // For objects, we only need to pass the properties that are different
  newer = { ...newer }
  Object.keys(newer).forEach(key => {
    if ((key === 'name' && compareNames(newer[key], older[key])) || diff(newer[key], older?.[key]) === undefined) {
      delete newer[key]
    }
  })

  if (isEmpty(newer)) {
    return
  }

  return { ...newer, id: older.id }
}
