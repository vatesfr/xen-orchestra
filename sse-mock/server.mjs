// Mock of the CAPI kubernetes API, limited to what is needed to develop the SSE support
// on the XO side and to serve as a reference for the CAPI implementation
//
// This is a throwaway development tool: the payloads are placeholders and none of this is
// meant to be merged
//
// Usage: node server.mjs [port]     (default port: 30080, same as the CAPI dev instance)

import { createServer } from 'node:http'

const PORT = Number(process.argv[2] ?? process.env.PORT ?? 30080)

// Sent to the client when it is idle, so that the connection is not considered dead by the
// intermediaries (reverse proxies, firewalls) nor by the HTTP client of XO
//
// It MUST be shorter than the body timeout of any intermediary: undici, used by XO, aborts
// a response when it receives nothing for `bodyTimeout` milliseconds
const DEFAULT_HEARTBEAT = 5e3

// Time between two events of the `stream` scenario
const DEFAULT_INTERVAL = 2e3

const PHASES = ['Provisioning', 'Provisioned', 'Running', 'Deleting']

// The shape of these objects is a placeholder: only the plumbing is relevant for now
const CLUSTERS = new Map(
  ['cluster-1', 'cluster-2'].map((id, i) => [
    id,
    { id, name: `mock-${id}`, phase: 'Running', nodeCount: i + 2, updatedAt: new Date().toISOString() },
  ])
)

// ===================================================================
// SSE
// ===================================================================

function openEventStream(res) {
  res.writeHead(200, {
    'content-type': 'text/event-stream',

    // `no-transform` forbids the intermediaries to compress or buffer the response: a
    // compressed SSE stream is buffered and the events are not received in real time
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',

    // nginx buffers the responses by default, which delays the events until its buffer is
    // full: XOA serves the REST API through nginx
    'x-accel-buffering': 'no',

    // only useful for a development tool, to allow a browser to connect to this mock
    'access-control-allow-origin': '*',
  })

  // an event is a `event:` line, a `data:` line and an empty line
  //
  // `id:` is deliberately not sent: resuming a stream with `Last-Event-ID` is not part of
  // the first version
  return function sendEvent(event, data) {
    return res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }
}

// ===================================================================
// Scenarios
//
// They are selected with the `scenario` query parameter and are here to exercise the cases
// which are easy to get wrong: an idle connection, a flooded client, an interrupted stream
// ===================================================================

const SCENARIOS = {
  // an event every `interval` milliseconds
  stream({ cluster, sendEvent, interval, onCleanup }) {
    const intervalId = setInterval(() => {
      cluster.phase = PHASES[(PHASES.indexOf(cluster.phase) + 1) % PHASES.length]
      cluster.updatedAt = new Date().toISOString()

      sendEvent('update', cluster)
    }, interval)

    onCleanup(() => clearInterval(intervalId))
  },

  // `count` events at once, then nothing but heartbeats
  burst({ cluster, sendEvent, count }) {
    for (let i = 0; i < count; i++) {
      sendEvent('add', { ...cluster, id: `${cluster.id}-node-${i}`, name: `node-${i}` })
    }
  },

  // nothing but heartbeats: the case which reveals the timeouts and the buffering of the
  // intermediaries
  idle() {},

  // as many events as possible, to fill the buffers and exercise the backpressure of the
  // consumer (XO destroys an SSE client which cannot keep up)
  flood({ cluster, sendEvent, size, onCleanup }) {
    const padding = 'x'.repeat(size)

    const intervalId = setInterval(() => {
      sendEvent('update', { ...cluster, padding })
    }, 1)

    onCleanup(() => clearInterval(intervalId))
  },

  // an error is sent, then the stream is ended: the client must be able to tell this apart
  // from a lost connection
  error({ sendEvent, res, interval, onCleanup }) {
    const timeoutId = setTimeout(() => {
      sendEvent('error', { status: 500, title: 'Internal Server Error', detail: 'mocked failure' })
      res.end()
    }, interval)

    onCleanup(() => clearTimeout(timeoutId))
  },

  // the connection is destroyed without any notice, as if the CAPI had crashed
  close({ res, interval, onCleanup }) {
    const timeoutId = setTimeout(() => res.destroy(), interval)

    onCleanup(() => clearTimeout(timeoutId))
  },
}

function handleEventStream(req, res, { cluster, query }) {
  const scenarioName = query.get('scenario') ?? 'stream'
  const scenario = SCENARIOS[scenarioName]
  if (scenario === undefined) {
    return sendError(res, 400, 'Bad Request', `unknown scenario "${scenarioName}"`)
  }

  const heartbeat = Number(query.get('heartbeat') ?? DEFAULT_HEARTBEAT)
  const interval = Number(query.get('interval') ?? DEFAULT_INTERVAL)
  const count = Number(query.get('count') ?? 20)
  const size = Number(query.get('size') ?? 64 * 1024)

  const sendEvent = openEventStream(res)

  const cleanupCallbacks = []
  const onCleanup = callback => cleanupCallbacks.push(callback)

  const startedAt = Date.now()
  log(`stream opened   ${cluster.id} scenario=${scenarioName} heartbeat=${heartbeat}ms`)

  res.on('close', () => {
    cleanupCallbacks.forEach(callback => callback())
    log(`stream closed   ${cluster.id} scenario=${scenarioName} after ${Math.round((Date.now() - startedAt) / 1e3)}s`)
  })

  // the first event, it gives the client the state it has to start from
  sendEvent('init', cluster)

  const heartbeatId = setInterval(() => sendEvent('ping', { ping: Date.now() }), heartbeat)
  onCleanup(() => clearInterval(heartbeatId))

  scenario({ cluster, count, interval, onCleanup, req, res, sendEvent, size })
}

// ===================================================================
// Other endpoints
//
// Just enough of the CAPI to point the whole kubernetes module of XO at this mock
// ===================================================================

// The specification is served so that the XO documentation can be built against this mock,
// including the SSE endpoint which is not a JSON endpoint
const OPENAPI_SPEC = {
  openapi: '3.1.0',
  info: { title: 'Cluster service (mock)', version: '0.0.0', description: 'Mocked CAPI, SSE proof of concept' },
  components: {
    schemas: {
      ClusterInfo: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          phase: { type: 'string' },
          nodeCount: { type: 'integer' },
          updatedAt: { type: 'string' },
        },
        required: ['id', 'name', 'phase'],
      },
    },
  },
  paths: {
    '/api/kubernetes/clusters/': {
      get: {
        summary: 'get clusters',
        tags: ['Clusters'],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/ClusterInfo' } } },
            },
          },
        },
      },
    },
    '/api/kubernetes/clusters/{id}': {
      get: {
        summary: 'get cluster',
        tags: ['Clusters'],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ClusterInfo' } } },
          },
        },
      },
    },
    '/api/kubernetes/clusters/{id}/events': {
      get: {
        summary: 'watch a cluster',
        description: 'Opens an SSE stream of the events of the cluster',
        tags: ['Clusters'],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'OK',
            content: { 'text/event-stream': { schema: { type: 'string' } } },
          },
        },
      },
    },
  },
}

// A page to watch a stream from a browser, which is the quickest way to check that the
// events are received one by one and not in a single buffered chunk
const DEMO_PAGE = `<!doctype html>
<meta charset="utf-8">
<title>CAPI SSE mock</title>
<body style="font: 14px monospace">
<h1>CAPI SSE mock</h1>
<p>Streaming <code id="url"></code></p>
<pre id="log"></pre>
<script>
  const params = new URLSearchParams(location.search)
  const cluster = params.get('cluster') ?? 'cluster-1'
  params.delete('cluster')

  const url = '/api/kubernetes/clusters/' + cluster + '/events?' + params
  document.getElementById('url').textContent = url

  const log = document.getElementById('log')
  const source = new EventSource(url)
  for (const event of ['init', 'ping', 'add', 'update', 'remove', 'error']) {
    source.addEventListener(event, ({ data }) => {
      log.textContent = new Date().toISOString() + ' ' + event + ' ' + data + '\\n' + log.textContent
    })
  }
  source.onerror = () => {
    log.textContent = new Date().toISOString() + ' [connection error, the browser will retry]\\n' + log.textContent
  }
</script>
`

// ===================================================================

function sendJson(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(payload),
    'access-control-allow-origin': '*',
  })
  res.end(payload)
}

// mimics the error format of the CAPI
function sendError(res, status, title, detail) {
  sendJson(res, status, { status, title, detail })
}

function log(message) {
  // eslint-disable-next-line no-console
  console.log(`${new Date().toISOString()} ${message}`)
}

const CLUSTER_EVENTS_RE = /^\/api\/kubernetes\/clusters\/([^/]+)\/events$/
const CLUSTER_RE = /^\/api\/kubernetes\/clusters\/([^/]+)$/

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
  const path = url.pathname

  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method Not Allowed', `${req.method} is not mocked`)
  }

  if (path === '/' || path === '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    return res.end(DEMO_PAGE)
  }

  if (path === '/swagger/openapi.json') {
    return sendJson(res, 200, OPENAPI_SPEC)
  }

  if (path === '/api/kubernetes/clusters' || path === '/api/kubernetes/clusters/') {
    return sendJson(res, 200, Array.from(CLUSTERS.values()))
  }

  const eventsMatch = CLUSTER_EVENTS_RE.exec(path)
  if (eventsMatch !== null) {
    const cluster = CLUSTERS.get(decodeURIComponent(eventsMatch[1]))
    if (cluster === undefined) {
      return sendError(res, 404, 'Not Found', `unknown cluster "${eventsMatch[1]}"`)
    }

    return handleEventStream(req, res, { cluster, query: url.searchParams })
  }

  const clusterMatch = CLUSTER_RE.exec(path)
  if (clusterMatch !== null) {
    const cluster = CLUSTERS.get(decodeURIComponent(clusterMatch[1]))

    return cluster === undefined
      ? sendError(res, 404, 'Not Found', `unknown cluster "${clusterMatch[1]}"`)
      : sendJson(res, 200, cluster)
  }

  sendError(res, 404, 'Not Found', `${path} is not mocked`)
})

// an SSE connection is idle most of the time: the server must not close it
server.requestTimeout = 0
server.headersTimeout = 0
server.keepAliveTimeout = 0

server.listen(PORT, () => {
  log(`CAPI SSE mock listening on http://localhost:${PORT}`)
  log(`clusters: ${Array.from(CLUSTERS.keys()).join(', ')}`)
})
