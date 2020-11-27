// ===================================================================
// Tools to manipulate rrd stats
// ===================================================================

import map from 'lodash/map'
import values from 'lodash/values'
import { mapPlus } from 'utils'

// Returns a new array with arrays sums.
// Example: computeArraysSum([[1, 2], [3, 4], [5, 0]) = [9, 6]
const _computeArraysSum = arrays => {
  if (!arrays || !arrays.length || !arrays[0].length) {
    return []
  }

  const n = arrays[0].length // N items in each array
  const m = arrays.length // M arrays

  const result = new Array(n)

  for (let i = 0; i < n; i++) {
    result[i] = 0

    for (let j = 0; j < m; j++) {
      result[i] += arrays[j][i]
    }
  }

  return result
}

// Returns a new array with arrays avgs.
// Example: computeArraysAvg([[1, 2], [3, 4], [5, 0]) = [4.5, 2]
const _computeArraysAvg = arrays => {
  const sums = _computeArraysSum(arrays)

  if (!arrays[0]) {
    return []
  }
  const n = arrays && arrays[0].length
  const m = arrays.length

  for (let i = 0; i < n; i++) {
    sums[i] /= m
  }

  return sums
}

// Arrays can be null.
// See: https://github.com/vatesfr/xen-orchestra/issues/969
//
// It's a fix to avoid error like `Uncaught TypeError: Cannot read property 'length' of null`.
// FIXME: Repare this bug in xo-server. (Warning: Can break the stats of xo-web v4.)
const removeUndefinedArrays = arrays =>
  mapPlus(arrays, (array, push) => {
    if (array != null) {
      push(array)
    }
  })

export const computeArraysSum = arrays => _computeArraysSum(removeUndefinedArrays(arrays))
export const computeArraysAvg = arrays => _computeArraysAvg(removeUndefinedArrays(arrays))

// More complex than computeArraysAvg.
//
// Take in parameter one object like:
// { x: { a: [...], b: [...], c: [...] },
//   y: { d: [...], e: [...], f: [...] } }
// and returns the avgs between a, b, c, d, e and f.
// Useful for vifs, pifs, xvds.
//
// Note: The parameter can be also an 3D array.
export const computeObjectsAvg = objects => {
  return _computeArraysAvg(map(objects, object => computeArraysAvg(values(object))))
}
