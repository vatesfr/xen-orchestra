import iteratee from 'lodash/iteratee'
import pDelay from 'promise-toolbox/delay'

function stopRetry(error) {
  this.error = error
  // eslint-disable-next-line no-throw-literal
  throw this
}

// do not retry on ReferenceError and TypeError which are programmer errors
const defaultMatcher = error =>
  !(error instanceof ReferenceError || error instanceof TypeError)

export default async function pRetry(
  fn,
  { delay = 1e3, tries = 10, when } = {}
) {
  const container = { error: undefined }
  const stop = stopRetry.bind(container)

  when = when === undefined ? defaultMatcher : iteratee(when)

  while (true) {
    try {
      return await fn(stop)
    } catch (error) {
      if (error === container) {
        throw container.error
      }
      if (--tries === 0 || !when(error)) {
        throw error
      }
    }
    await pDelay(delay)
  }
}
