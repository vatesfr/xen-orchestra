exports.transformResult = (fn, transform) =>
  function () {
    return transform.call(this, fn.apply(this, arguments), ...arguments)
  }
