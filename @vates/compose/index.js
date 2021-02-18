'use strict'

exports.compose = function compose(fns) {
  if (!Array.isArray(fns)) {
    fns = Array.from(arguments)
  }
  const n = fns.length
  if (n === 0) {
    throw new TypeError('at least one function must be passed')
  }
  if (n === 1) {
    return fns[0]
  }
  return function (value) {
    for (let i = 0; i < n; ++i) {
      value = fns[i](value)
    }
    return value
  }
}
