'use strict'

const identity = v => v

/**
 * Compute the list of differences from data1 to data2
 *
 * @param {Array|Buffer|string} data1
 * @param {Array|Buffer|string} data2
 * @returns
 */
module.exports = function diff(data1, data2, encodeDiff = identity) {
  const diffs = []
  const n1 = data1.length
  const n2 = data2.length
  const n = Math.min(n1, n2)
  for (let i = 0; i < n; ++i) {
    if (data1[i] !== data2[i]) {
      let j = i + 1
      while (j < n && data1[j] !== data2[j]) {
        ++j
      }
      diffs.push([i, encodeDiff(data2.slice(i, j))])
      i = j
    }
  }
  if (n1 !== n2) {
    diffs.push([n, encodeDiff(n1 < n2 ? data2.slice(n) : data2.slice(0, 0))])
  }
  return diffs
}
