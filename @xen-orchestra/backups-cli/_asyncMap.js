const curryRight = require('lodash/curryRight')

module.exports = curryRight((iterable, fn) =>
  Promise.all(Array.isArray(iterable) ? iterable.map(fn) : Array.from(iterable, fn))
)
