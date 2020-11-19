import Resource from 'promise-toolbox/_Resource'

export function disposeResourceOnStop(res, hooks) {
  const dispose = value => {
    if (res.d !== undefined) {
      hooks.removeListener('stop', dispose)
      const d = res.d
      res.d = undefined
      return d(value)
    }
  }
  hooks.on('stop', dispose)
  return new Resource(res.p, dispose)
}
