// ===================================================================
// Tools to manipulate rrd stats
// ===================================================================

import map from 'lodash/map'
import values from 'lodash/values'

// Returns a new array with arrays sums.
// Example: computeArraysSum([[1, 2], [3, 4], [5, 0]) = [9, 6]
export const computeArraysSum = arrays => {
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
export const computeArraysAvg = arrays => {
  const sums = computeArraysSum(arrays)

  const n = arrays && arrays[0].length
  const m = arrays.length

  for (let i = 0; i < n; i++) {
    sums[i] /= m
  }

  return sums
}

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
  return computeArraysAvg(
    map(objects, object =>
      computeArraysAvg(values(object))
    )
  )
}
