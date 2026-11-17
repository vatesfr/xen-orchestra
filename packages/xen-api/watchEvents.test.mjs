import { once } from 'node:events'
import { mock, test } from 'node:test'
import { strict as assert } from 'node:assert'

import { Xapi } from './index.mjs'

test('watchEvents() disconnects when the event loop fails', async () => {
  const warn = mock.method(console, 'warn', () => {})
  const error = new Error('listener failure')

  const xapi = new Xapi({ url: 'https://user:password@192.0.2.1', watchEvents: false })
  xapi._sessionOpenWithFailover = async () => {}
  await xapi.connect()
  xapi._watchEvents = () => Promise.reject(error)

  // fails instead of hanging when nothing disconnects
  const disconnected = once(xapi, 'disconnected', { signal: AbortSignal.timeout(2000) })
  xapi.watchEvents()
  await disconnected

  assert.equal(xapi.status, 'disconnected')
  assert.equal(warn.mock.calls[0].arguments[1], error)
})
