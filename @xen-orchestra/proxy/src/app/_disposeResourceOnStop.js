import Resource from 'promise-toolbox/_Resource'

export function disposeResourceOnStop(res, getHooks) {
  const hooks = getHooks.call(this)

  const dispose = value => {
    if (res.d !== undefined) {
      const d = res.d
      res.d = undefined
      return d(value)
    }
  }
  hooks.on('stop', dispose)
  return new Resource(res.p, value => {
    hooks.removeListener('stop', dispose)
    return dispose(value)
  })
}
