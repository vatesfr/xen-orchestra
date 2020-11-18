export const decorateResult = (fn, ...args) => (target, name, descriptor) => ({
  ...descriptor,
  value: function () {
    return fn.apply(this, [descriptor.value.apply(this, arguments), ...args])
  },
})
