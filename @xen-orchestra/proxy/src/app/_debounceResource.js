import Resource from 'promise-toolbox/_Resource'
import { parseDuration } from '@vates/parse-duration'

export function debounceResource(resource, [getDelay], args) {
  const delay = parseDuration(getDelay.apply(this, args))
  return delay === 0
    ? resource
    : new Resource(resource.p, value =>
        setTimeout(() => resource.d(value), delay)
      )
}
