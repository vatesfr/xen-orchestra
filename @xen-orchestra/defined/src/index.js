// @flow

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
export default function defined () {
  let args = arguments
  let n = args.length
  if (n === 1) {
    args = arguments[0]
    n = args.length
  }

  for (let i = 0; i < n; ++i) {
    let arg = arguments[i]
    if (typeof arg === 'function') {
      arg = get(arg)
    }
    if (arg !== undefined) {
      return arg
    }
  }
}

// Usage:
//
// ```js
// const friendName = get(() => props.user.friends[0].name)
//
// // this form can be used to avoid recreating functions:
// const getFriendName = _ => _.friends[0].name
// const friendName = get(getFriendName, props.user)
// ```
export const get = (accessor: (input: ?any) => any, arg: ?any) => {
  try {
    return accessor(arg)
  } catch (error) {
    if (!(error instanceof TypeError)) {
      // avoid hidding other errors
      throw error
    }
  }
}

// Usage:
//
// ```js
// const httpAgent = ifDef(
//   process.env.HTTP_PROXY,
//   _ => new ProxyAgent(_)
// )
// ```
export const ifDef = (value: ?any, thenFn: (value: any) => any) =>
  value !== undefined ? thenFn(value) : value
