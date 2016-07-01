// ===================================================================
// Tools to manipulate rrd stats
// ===================================================================

import map from 'lodash/map'

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

export const computeArraysAvg = arrays => {
  const sums = computeArraysSum(arrays)

  const n = arrays && arrays[0].length
  const m = arrays.length

  for (let i = 0; i < n; i++) {
    sums[i] /= m
  }

  return sums
}

export const computeObjectsAvg = objects => {
  return computeArraysAvg(
    map(objects, object =>
      computeArraysAvg(map(object, arr => arr))
    )
  )
}
