import { createServer } from 'node:net'
import { pipeline } from 'node:stream/promises'
import { request } from 'undici'
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { Writable } from 'node:stream'

import { Xapi } from './index.mjs'

// Regression test for https://github.com/nodejs/undici/issues/5360
//
// XAPI answers exports and `/pool/xmldbdump` with an EOF-delimited body:
// `Connection: close`, no `content-length`, no chunked encoding. When the
// consumer is slower than the host (a backup written to a remote repository),
// undici's HTTP/1 parser pauses on backpressure. If the peer then sends FIN
// while the parser is paused, `Parser.finish()` used to `assert(!this.paused)`
// from inside the socket `'end'` handler, where nothing can catch it: the
// process got an uncaught `AssertionError` and the transfer never settled — all
// the bytes were delivered but neither `end` nor `error` was ever emitted.
//
// Fixed in undici 8.10.0, which drains the still-buffered data on `finish()`
// instead of asserting. This test guards the version floor: it fails on
// undici 6.x and 7.x.

const BODY_SIZE = 1024 * 1024

const TEST_TIMEOUT = 10e3

// answers any request with an EOF-delimited body, then closes
function createXapiLikeServer() {
  const body = Buffer.alloc(BODY_SIZE, 0x61)

  const server = createServer(socket => {
    socket.on('error', () => {})
    socket.once('data', () => {
      socket.write('HTTP/1.1 200 OK\r\nConnection: close\r\n\r\n')
      socket.write(body)
      socket.end()
    })
  })

  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

// consumes the body slower than the server sends it, which is what makes the
// parser pause
function createSlowSink(counter, delay = 10) {
  return new Writable({
    highWaterMark: 1,
    write(chunk, _encoding, callback) {
      counter.size += chunk.length
      setTimeout(callback, delay)
    },
  })
}

test('a host closing an export while the consumer is behind', async t => {
  const server = await createXapiLikeServer()
  t.after(() => server.close())

  // the dispatcher `getResource` uses, built by the constructor: no connection
  // is opened and no XAPI is contacted
  const xapi = new Xapi({ url: 'https://user:password@127.0.0.1', watchEvents: false })
  const dispatcher = xapi._undiciDispatcher

  // `close()` waits for the in-flight request, which is exactly what never
  // completes when the bug strikes
  t.after(() => dispatcher.destroy())

  const { address, port } = server.address()
  const response = await request(`http://${address}:${port}/export`, {
    dispatcher,

    // as in `getResource`, which follows redirections itself
    maxRedirections: 0,
  })

  const counter = { size: 0 }

  // the timer is kept referenced: when the bug strikes, the transfer is the
  // only thing left on the event loop and it never settles
  let timer
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error('the transfer never settled')), TEST_TIMEOUT)
  })

  try {
    await Promise.race([pipeline(response.body, createSlowSink(counter)), timeout])
  } finally {
    clearTimeout(timer)
  }

  // the uncaught `AssertionError` thrown from the socket `'end'` handler is not
  // asserted on: it escapes to the process, where the test runner reports it and
  // fails this test on its own
  assert.equal(counter.size, BODY_SIZE, 'the whole body should be delivered')
})
