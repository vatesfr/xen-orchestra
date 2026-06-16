import type { ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'
import { type Fixture, type FixtureScale, getFixture } from './fixture.ts'

// Dev-only mock of the XO REST API, enabled with `XO_MOCK=1 yarn dev`.
// It serves a large generated fixture (see ./fixture.ts) so the data layer can be
// benchmarked at realistic scale without a real XO backend. It implements just enough
// of the REST + SSE surface that `defineRemoteResource` and `useWatchCollection` need:
// the bulk collection endpoints and the SSE handshake that gates the initial fetch.

const BASE_PATH = '/rest/v0'

const COLLECTION_PATHS = ['pools', 'hosts', 'vms', 'vbds', 'vdis'] as const

type CollectionPath = (typeof COLLECTION_PATHS)[number]

function readScaleFromEnv(): FixtureScale {
  const toInt = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseInt(value ?? '', 10)

    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
  }

  return {
    pools: toInt(process.env.XO_MOCK_POOLS, 74),
    hosts: toInt(process.env.XO_MOCK_HOSTS, 515),
    vms: toInt(process.env.XO_MOCK_VMS, 38000),
    vbdsPerVm: toInt(process.env.XO_MOCK_VBDS_PER_VM, 2),
  }
}

function pickFields(record: Record<string, unknown>, fields: string[] | undefined) {
  if (fields === undefined) {
    return record
  }

  const picked: Record<string, unknown> = {}

  fields.forEach(field => {
    if (field in record) {
      picked[field] = record[field]
    }
  })

  return picked
}

function getCollectionData(fixture: Fixture, collection: CollectionPath): Record<string, unknown>[] {
  return fixture[collection]
}

function sendCollection(res: ServerResponse, records: Record<string, unknown>[], url: URL) {
  const fields = url.searchParams.get('fields')?.split(',')
  const limitParam = url.searchParams.get('limit')
  const limit = limitParam !== null ? Number.parseInt(limitParam, 10) : undefined
  const isNdjson = url.searchParams.has('ndjson')

  const items = limit !== undefined && Number.isFinite(limit) ? records.slice(0, limit) : records

  res.statusCode = 200
  res.setHeader('content-type', isNdjson ? 'application/x-ndjson' : 'application/json')

  const CHUNK_SIZE = 1000

  if (isNdjson) {
    for (let start = 0; start < items.length; start += CHUNK_SIZE) {
      const chunk = items
        .slice(start, start + CHUNK_SIZE)
        .map(record => JSON.stringify(pickFields(record, fields)))
        .join('\n')
      res.write(chunk + '\n')
    }
    res.end()

    return
  }

  res.write('[')

  for (let start = 0; start < items.length; start += CHUNK_SIZE) {
    const chunk = items
      .slice(start, start + CHUNK_SIZE)
      .map(record => JSON.stringify(pickFields(record, fields)))
      .join(',')
    res.write(start === 0 ? chunk : ',' + chunk)
  }

  res.write(']')
  res.end()
}

async function readJsonBody(req: Connect.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []

  for await (const chunk of req) {
    chunks.push(chunk as Buffer)
  }

  if (chunks.length === 0) {
    return {}
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return {}
  }
}

function startEventStream(res: ServerResponse, fixture: Fixture) {
  res.statusCode = 200
  res.setHeader('content-type', 'text/event-stream')
  res.setHeader('cache-control', 'no-cache')
  res.setHeader('connection', 'keep-alive')
  res.flushHeaders?.()

  const sseId = `sse-${process.pid}-${res.socket?.remotePort ?? 0}`
  res.write(`event: init\ndata: ${JSON.stringify({ id: sseId })}\n\n`)

  const pingInterval = setInterval(() => {
    res.write(`event: ping\ndata: ${JSON.stringify({ ping: 0 })}\n\n`)
  }, 10_000)

  const updatesPerSec = Number.parseInt(process.env.XO_MOCK_UPDATES_PER_SEC ?? '0', 10)
  let updateInterval: NodeJS.Timeout | undefined

  if (Number.isFinite(updatesPerSec) && updatesPerSec > 0 && fixture.vms.length > 0) {
    let cursor = 0
    updateInterval = setInterval(
      () => {
        const vm = fixture.vms[cursor % fixture.vms.length]
        cursor += 1
        res.write(`event: update\ndata: ${JSON.stringify({ ...vm, $subscription: 'VM' })}\n\n`)
      },
      Math.floor(1000 / updatesPerSec)
    )
  }

  res.on('close', () => {
    clearInterval(pingInterval)
    if (updateInterval !== undefined) {
      clearInterval(updateInterval)
    }
  })
}

export function mockRestPlugin(): Plugin {
  const scale = readScaleFromEnv()

  return {
    name: 'xo-mock-rest',
    configureServer(server) {
      const fixture = getFixture(scale)

      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url ?? ''

        if (!rawUrl.startsWith(BASE_PATH)) {
          return next()
        }

        const url = new URL(rawUrl, 'http://localhost')
        const path = url.pathname

        if (path === `${BASE_PATH}/events` && req.method === 'GET') {
          startEventStream(res, fixture)

          return
        }

        const subscriptionsMatch = path.match(/^\/rest\/v0\/events\/[^/]+\/subscriptions(?:\/([^/]+))?$/)

        if (subscriptionsMatch !== null) {
          if (req.method === 'POST') {
            readJsonBody(req).then(body => {
              const collection = String(body.collection ?? 'unknown')
              res.statusCode = 200
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify({ id: `sub-${collection}` }))
            })

            return
          }

          if (req.method === 'DELETE') {
            res.statusCode = 204
            res.end()

            return
          }
        }

        const collection = COLLECTION_PATHS.find(name => path === `${BASE_PATH}/${name}`)

        if (collection !== undefined && req.method === 'GET') {
          sendCollection(res, getCollectionData(fixture, collection), url)

          return
        }

        return next()
      })

      const summary = COLLECTION_PATHS.map(name => `${name}=${getCollectionData(fixture, name).length}`).join(', ')
      server.config.logger.info(`[xo-mock-rest] serving fixture (${summary})`)
    },
  }
}
