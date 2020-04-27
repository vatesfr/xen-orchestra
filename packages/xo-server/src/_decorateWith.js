// Creates a decorator from a function wrapper.
//
// For instance, allows using Lodash's functions as decorators:
//
// ```js
// @decorateWith(lodash.debounce, 150)
// myMethod() {
//   // body
// }
// ```
export const decorateWith = (fn, ...args) => (target, name, descriptor) => ({
  ...descriptor,
  value: fn(descriptor.value, ...args),
})
