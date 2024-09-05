'use strict'

// Usage:
//
// ```js
// const httpProxy = defined(
//   process.env.HTTP_PROXY,
//   process.env.http_proxy
// )
//
// const httpProxy = defined([
//   process.env.HTTP_PROXY,
//   process.env.http_proxy
// ])
// ```
function defined() {
  let args = arguments
  let n = args.length
  if (n === 1) {
    args = arguments[0]
    n = args.length
  }

  for (let i = 0; i < n; ++i) {
    let arg = args[i]
    if (typeof arg === 'function') {
      arg = get(arg)
    }
    if (arg !== undefined) {
      return arg
    }
  }
}
module.exports = exports = defined

// Usage:
//
// ```js
// const friendName = get(() => props.user.friends[0].name)
//
// // this form can be used to avoid recreating functions:
// const getFriendName = _ => _.friends[0].name
// const friendName = get(getFriendName, props.user)
// ```
function get(accessor, arg) {
  try {
    return accessor(arg)
  } catch (error) {
    if (!(error instanceof TypeError)) {
      // avoid hiding other errors
      throw error
    }
  }
}
exports.get = get

// Usage:
//
// ```js
// const httpAgent = ifDef(
//   process.env.HTTP_PROXY,
//   _ => new ProxyAgent(_)
// )
// ```
exports.ifDef = function ifDef(value, thenFn) {
  return value !== undefined ? thenFn(value) : value
}
