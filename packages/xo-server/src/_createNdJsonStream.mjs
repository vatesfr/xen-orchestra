import asyncIteratorToStream from 'async-iterator-to-stream'

function* values(object) {
  const keys = Object.keys(object)
  for (let i = 0, n = keys.length; i < n; ++i) {
    yield object[keys[i]]
  }
}

/**
 * Creates a NDJSON stream of all the values
 *
 * @param {(Array|Object)} collection
 */
export default asyncIteratorToStream(function* (collection) {
  for (const value of Array.isArray(collection) ? collection : values(collection)) {
    yield JSON.stringify(value)
    yield '\n'
  }
})
