// @decorateResult(function(result, [arg1, arg2], [fnArg1, fnArg2]) {}, arg1, arg2)
// fn(fnArg1, fnArg2) {}

export const decorateResult = (fn, ...args) => (target, name, descriptor) => ({
  ...descriptor,
  value: function () {
    return fn.call(
      this,
      descriptor.value.apply(this, arguments),
      args,
      arguments
    )
  },
})
