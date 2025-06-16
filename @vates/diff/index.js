'use strict'

/**
 * Compare two data arrays, buffers or strings and invoke the provided callback function for each difference.
 *
 * @template {Array|Buffer|string} T
 * @param {Array|Buffer|string} data1 - The first data array or buffer to compare.
 * @param {T} data2 - The second data array or buffer to compare.
 * @param {(index: number, diff: T) => void} [cb] - The callback function to invoke for each difference. If not provided, an array of differences will be returned.
 * @returns {Array<number|T>|undefined} - An array of differences if no callback is provided; otherwise, undefined.
 */
module.exports = function diff(data1, data2, cb) {
  let result
  if (cb === undefined) {
    result = []
    cb = result.push.bind(result)
  }

  const n1 = data1.length
  const n2 = data2.length
  const n = Math.min(n1, n2)
  for (let i = 0; i < n; ++i) {
    if (data1[i] !== data2[i]) {
      let j = i + 1
      while (j < n && data1[j] !== data2[j]) {
        ++j
      }
      cb(i, data2.slice(i, j))
      i = j
    }
  }
  if (n1 !== n2) {
    cb(n, n1 < n2 ? data2.slice(n) : data2.slice(0, 0))
  }

  return result
}
