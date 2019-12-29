// Invoke a function and returns it result.
// All parameters are forwarded.
//
// Why using `invoke()`?
// - avoid tedious IIFE syntax
// - avoid declaring variables in the common scope
// - monkey-patching
//
// ```js
// const sum = invoke(1, 2, (a, b) => a + b)
//
// eventEmitter.emit = invoke(eventEmitter.emit, emit => function (event) {
//   if (event === 'foo') {
//     throw new Error('event foo is disabled')
//   }
//
//   return emit.apply(this, arguments)
// })
// ```
export default function invoke(fn) {
  const n = arguments.length - 1
  if (!n) {
    return fn()
  }

  fn = arguments[n]
  const args = new Array(n)
  for (let i = 0; i < n; ++i) {
    args[i] = arguments[i]
  }

  return fn.apply(undefined, args)
}
