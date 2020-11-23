import Resource from 'promise-toolbox/_Resource'
import { parseDuration } from '@vates/parse-duration'

export function debounceResource(resource, hooks, delay = 0) {
  delay = parseDuration(delay)
  if (delay === 0) {
    return resource
  }

  let timeoutId, value
  const dispose = () => {
    const { d } = resource
    if (d !== undefined) {
      resource.d = undefined
      hooks.removeListener('stop', onStop)
      return d(value)
    }
  }

  const onStop = () => {
    const shouldDisposeNow = timeoutId !== undefined
    if (shouldDisposeNow) {
      clearTimeout(timeoutId)
      return dispose()
    } else {
      // will dispose ASAP
      delay = 0
    }
  }
  hooks.on('stop', onStop)

  return new Resource(resource.p, v => {
    value = v
    timeoutId = setTimeout(dispose, delay)
  })
}
