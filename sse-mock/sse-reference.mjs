// Minimal reference of the SSE endpoint expected by XO, to be implemented by the CAPI
//
// Everything here is either required by the protocol or explained in a comment: there is
// no application logic, the cluster and its updates are faked
//
// Usage: node sse-reference.mjs [port]     (default: 30080)

import { createServer } from 'node:http'

const PORT = Number(process.argv[2] ?? 30080)

// Sent while the stream is idle so that it is not considered dead
//
// It MUST be shorter than the body timeout of any HTTP client or intermediary: undici,
// used by XO, aborts a response when it receives nothing for `bodyTimeout` milliseconds
const HEARTBEAT = 5e3

const PHASES = ['Provisioning', 'Provisioned', 'Running']

createServer((req, res) => {
  // one stream per cluster: `GET /api/kubernetes/clusters/{id}/events`
  const { pathname } = new URL(req.url, `http://${req.headers.host}`)
  const match = /^\/api\/kubernetes\/clusters\/([^/]+)\/events$/.exec(pathname)

  if (match === null) {
    res.writeHead(404, { 'content-type': 'application/json' })
    return res.end('{"status":404,"title":"Not Found"}')
  }

  const cluster = { id: decodeURIComponent(match[1]), phase: 'Running' }

  res.writeHead(200, {
    'content-type': 'text/event-stream',

    // `no-transform` forbids the intermediaries to compress or buffer the response: a
    // compressed or buffered stream is not received in real time
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',

    // nginx buffers the responses by default, which holds the events back until its
    // buffer is full: XO is served through nginx
    'x-accel-buffering': 'no',
  })

  // An event is a `event:` line, a `data:` line holding JSON and an empty line
  //
  // `id:` is not sent: resuming a stream with `Last-Event-ID` is not supported yet
  //
  // Each event must be flushed as it is produced: writing to the socket is enough in
  // Node, other runtimes usually require an explicit flush
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)

  // the first event gives the state the client starts from
  send('init', cluster)

  const heartbeatId = setInterval(() => send('ping', { ping: Date.now() }), HEARTBEAT)

  // faked changes: `add`, `update` and `remove` are the only other events
  const updateId = setInterval(() => {
    cluster.phase = PHASES[(PHASES.indexOf(cluster.phase) + 1) % PHASES.length]
    send('update', cluster)
  }, 2e3)

  // the timers, and whatever the stream was watching, must be released when the client
  // goes away, otherwise every disconnection leaks
  res.on('close', () => {
    clearInterval(heartbeatId)
    clearInterval(updateId)
    console.log(`stream closed ${cluster.id}`)
  })

  console.log(`stream opened ${cluster.id}`)
}).listen(PORT, () => console.log(`SSE reference listening on http://localhost:${PORT}`))
