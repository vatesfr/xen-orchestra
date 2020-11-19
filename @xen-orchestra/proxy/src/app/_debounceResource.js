import Resource from 'promise-toolbox/_Resource'
import { parseDuration } from '@vates/parse-duration'

export function debounceResource(resource, delay) {
  delay = parseDuration(delay)
  return delay === 0
    ? resource
    : new Resource(resource.p, value =>
        setTimeout(() => resource.d(value), delay)
      )
}
