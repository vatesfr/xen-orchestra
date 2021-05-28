exports.decorateWith = function decorateWith(fn, ...args) {
  return (target, name, descriptor) => ({
    ...descriptor,
    value: fn(descriptor.value, ...args),
  })
}
