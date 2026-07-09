'use strict'

module.exports = function pMap(array, iteratee) {
  const { then } = array
  return typeof then === 'function'
    ? then.call(array, array => pMap(array, iteratee))
    : Promise.all(array.map(iteratee))
}
