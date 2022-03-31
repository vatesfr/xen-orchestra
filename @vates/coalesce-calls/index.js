'use strict'

exports.coalesceCalls = function (fn) {
  let promise
  const clean = () => {
    promise = undefined
  }
  return function () {
    if (promise !== undefined) {
      return promise
    }
    promise = fn.apply(this, arguments)
    promise.then(clean, clean)
    return promise
  }
}
