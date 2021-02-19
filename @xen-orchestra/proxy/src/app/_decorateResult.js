// TODO: Move to @Vates

// Applies passed transformer to the result returned by the method
//
// @decorateResult(transform)
// method () {}
const decorateResult = fn => (target, name, descriptor) => ({
  ...descriptor,
  value: function () {
    return fn.call(this, descriptor.value.apply(this, arguments), ...arguments)
  },
})

exports.decorateResult = decorateResult
