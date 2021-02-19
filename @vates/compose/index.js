'use strict'

const defaultOpts = { async: false, right: false }

exports.compose = function compose(opts, fns) {
  if (Array.isArray(opts)) {
    fns = opts
    opts = defaultOpts
  } else if (typeof opts === 'object') {
    opts = Object.assign({}, defaultOpts, opts)
    if (!Array.isArray(fns)) {
      fns = Array.prototype.slice.call(arguments, 1)
    }
  } else {
    fns = Array.from(arguments)
    opts = defaultOpts
  }

  const n = fns.length
  if (n === 0) {
    throw new TypeError('at least one function must be passed')
  }
  if (n === 1) {
    return fns[0]
  }

  if (opts.right) {
    fns.reverse()
  }

  return opts.async
    ? async function () {
        let value = await fns[0].apply(this, arguments)
        for (let i = 1; i < n; ++i) {
          value = await fns[i](value)
        }
        return value
      }
    : function () {
        let value = fns[0].apply(this, arguments)
        for (let i = 1; i < n; ++i) {
          value = fns[i](value)
        }
        return value
      }
}
