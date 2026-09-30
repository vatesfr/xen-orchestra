# CAPI SSE mock

A throwaway mock of the kubernetes API (CAPI), limited to what is needed to:

1. develop the SSE support on the XO side before the real interface exists;
2. give the team implementing the CAPI a runnable reference of the expected behaviour.

Everything here is a placeholder — the payloads especially — and it is **not meant to be
merged**. Only the plumbing is relevant: the framing, the headers and the lifecycle of the
connection.

## Running it

```sh
node server.mjs          # listens on http://localhost:30080
node server.mjs 8080     # or on the port of your choice
```

No dependency, no build, Node >= 18.

Open <http://localhost:30080/> to watch a stream from a browser (the quickest way to check
that events are received one by one rather than in a single buffered chunk), or use curl:

```sh
# the default scenario: an event every 2s, a heartbeat every 5s
curl -N http://localhost:30080/api/kubernetes/clusters/cluster-1/events

# an idle stream: heartbeats only, the case which reveals timeouts and buffering
curl -N 'http://localhost:30080/api/kubernetes/clusters/cluster-1/events?scenario=idle'

# 20 events at once, then heartbeats
curl -N 'http://localhost:30080/api/kubernetes/clusters/cluster-1/events?scenario=burst&count=20'
```

`-N` disables curl's own buffering; without it the output looks batched and you will chase a
bug that is not there.

## The contract

This is what the CAPI is expected to implement, and what XO will consume.

### Endpoint

One stream per cluster:

```
GET /api/kubernetes/clusters/{id}/events
```

A cluster which does not exist answers `404` with the usual error body, not an empty stream.

### Response headers

```
content-type: text/event-stream
cache-control: no-cache, no-transform
connection: keep-alive
x-accel-buffering: no
```

- `no-transform` and `x-accel-buffering: no` tell the intermediaries not to compress or
  buffer the response. XOA serves the REST API through nginx, which buffers by default and
  would hold the events back until its buffer fills.
- The stream must **not** be compressed: a gzipped SSE stream is buffered by design.
- Each event must be flushed as it is produced. Writing to the socket is enough in Node; in
  other runtimes an explicit flush is usually required.

### Frames

```
event: update
data: {"id":"cluster-1","name":"mock-cluster-1","phase":"Running"}

```

- one `event:` line, one `data:` line holding JSON, then an empty line;
- **no `id:` line** — resuming with `Last-Event-ID` is out of scope for the first version;
- `retry:` is not used either, the client decides its own reconnection policy.

### Events

| event    | when                                                    | data                          |
| -------- | ------------------------------------------------------- | ----------------------------- |
| `init`   | first event of the stream                               | the current state of the cluster |
| `ping`   | every 5s while the stream is idle                       | `{ ping: <timestamp> }`       |
| `add`    | an object appeared                                      | the object                    |
| `update` | an object changed                                       | the object                    |
| `remove` | an object disappeared                                   | the object                    |
| `error`  | the stream is about to be closed because of a failure   | `{ status, title, detail }`   |

The vocabulary mirrors the one already used by XO's own SSE endpoint
(`GET /rest/v0/events`), so that the events can be forwarded to XO clients without being
translated.

### Heartbeat

`ping` every **5 seconds** while nothing else is sent.

This is not decorative: XO's HTTP client (undici) can be configured with a *body timeout*,
which measures the time between two chunks of a response and aborts the request when it
expires. A heartbeat slower than that timeout kills the stream. XO will also avoid applying
a body timeout to streaming endpoints, but the heartbeat is the defence in depth, and it
keeps reverse proxies and stateful firewalls from dropping an idle connection.

### Ending a stream

- Expected end (cluster deleted, client should stop): send `error` with a payload, then end
  the response.
- Failure: end or destroy the connection. The client cannot tell this apart from a network
  failure, which is why the explicit `error` event matters for the cases you can foresee.

### Not in scope for the first version

- `Last-Event-ID` / resume
- authentication (the CAPI is currently unauthenticated; XO restricts these endpoints to
  administrators on its side)
- a global, all-clusters stream

## Scenarios

Selected with the `scenario` query parameter:

| scenario | what it does                                              | what it is for                                  |
| -------- | --------------------------------------------------------- | ----------------------------------------------- |
| `stream` | an `update` every `interval` ms (default 2000)             | the nominal case                                |
| `burst`  | `count` `add` events at once (default 20), then heartbeats | parsing several events arriving in one chunk    |
| `idle`   | heartbeats only                                            | timeouts, nginx buffering, firewall idle drops  |
| `flood`  | an `update` every ms, padded to `size` bytes (default 64K) | backpressure — XO drops a client which lags     |
| `error`  | after `interval` ms, an `error` event then a clean end     | distinguishing a failure from a lost connection |
| `close`  | after `interval` ms, the socket is destroyed               | reconnection logic                              |

Other parameters: `heartbeat` (ms), `interval` (ms), `count`, `size` (bytes).

```sh
curl -N 'http://localhost:30080/api/kubernetes/clusters/cluster-1/events?scenario=close&interval=3000'
```

## Other endpoints

Just enough of the CAPI to point the whole kubernetes module of XO at this mock:

| endpoint                              | purpose                                              |
| ------------------------------------- | ---------------------------------------------------- |
| `GET /api/kubernetes/clusters/`       | list of clusters                                     |
| `GET /api/kubernetes/clusters/{id}`   | one cluster                                          |
| `GET /swagger/openapi.json`           | specification, including the SSE endpoint            |
| `GET /`                               | browser demo page                                    |

To use it from XO, point the proxy at it (in `xo-server`'s configuration):

```toml
[rest-api]
kubernetesProxyUrl = 'http://localhost:30080'
```

## Notes for the CAPI implementation

The parts which are easy to get wrong, in the order they usually bite:

1. **Buffering.** Anything between the server and the client that buffers — a compression
   middleware, nginx, a framework which writes to a response buffer — turns a live stream
   into a batch delivery. Test with `curl -N` against an `idle` stream, not against a busy
   one, where buffering is invisible.
2. **Flushing.** Write and flush per event.
3. **Heartbeat.** See above; 5s.
4. **Cleanup.** When the client disconnects, stop the timers and release whatever the
   stream was watching. This mock logs `stream opened` / `stream closed` so the lifecycle
   can be checked; a missing `stream closed` is a leak.
5. **Back pressure.** A client which does not read must not make the server grow without
   bound; drop it instead. XO does this on its own SSE endpoint (a slow client is
   destroyed once its buffer exceeds a configured size).
6. **One connection per cluster.** With a per-cluster endpoint, N clusters watched means N
   connections; keep the per-connection cost low.
