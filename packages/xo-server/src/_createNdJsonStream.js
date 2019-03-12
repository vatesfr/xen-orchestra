import asyncIteratorToStream from 'async-iterator-to-stream'

const getArrayValue = (array, i) => array[i]

function getObjectValue(object, i) {
  return object[this[i]]
}

/**
 * Creates a NDJSON stream of all the values
 *
 * @param {(Array|Object)} values
 */
module.exports = asyncIteratorToStream(function*(values) {
  let getter, n
  if (Array.isArray(values)) {
    getter = getArrayValue
    n = values.length
  } else {
    const keys = Object.keys(values)
    getter = getObjectValue.bind(keys)
    n = keys.length
  }

  for (let i = 0; i < n; ++i) {
    yield JSON.stringify(getter(values, i))
    yield '\n'
  }
})
