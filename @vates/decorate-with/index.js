exports.decorateWith = (fn, ...args) => (target, name, descriptor) => ({
  ...descriptor,
  value: fn(descriptor.value, ...args),
})
