// Decorate a method with a function decorator.
//
// ```js
// @decorateWith(lodash.debounce, 1e3)
// myMethod() {}
// ```
export const decorateWith = (decorator, ...args) => (
  target,
  name,
  descriptor
) => ({
  ...descriptor,
  value: decorator(descriptor.value, ...args),
})
