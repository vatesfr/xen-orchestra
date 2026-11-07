import { createServer } from 'node:http'
import { once } from 'node:events'
import { setTimeout as pDelay } from 'node:timers/promises'
import { createLogger } from '@xen-orchestra/log'

const { warn } = createLogger('xo:virtual-support-twin:fake-xapi')

const SESSION_REF = 'OpaqueRef:support-bundle-session'

// XO uses 60s, don't let a client hold a connection longer
const MAX_EVENT_WAIT = 60e3

class XapiError extends Error {
  constructor(code, params) {
    super(code)
    this.code = code
    this.params = params
  }
}

/**
 * Read-only XAPI serving records over JSON-RPC, enough for XO to connect and display them
 *
 * Unknown methods fail with `MESSAGE_METHOD_UNKNOWN`, no events are ever emitted.
 *
 * @param {Record<string, Record<string, object>>} recordsByType records by ref by XAPI type
 * @param {{ host?: string, port?: number }} [opts]
 * @returns {Promise<{ url: string, close(): Promise<void> }>}
 */
export async function createFakeXapi(recordsByType, { host = '127.0.0.1', port = 0 } = {}) {
  const types = Object.keys(recordsByType)
  const typesByLcType = new Map(types.map(type => [type.toLowerCase(), type]))
  const abortController = new AbortController()

  const handlers = {
    'event.from': async ([, , token, timeout]) => {
      await pDelay(Math.min(timeout * 1e3, MAX_EVENT_WAIT), undefined, { signal: abortController.signal })
      return { events: [], token, valid_ref_counts: {} }
    },
    'event.inject': () => '0',
    'session.login_with_password': () => SESSION_REF,
    'session.logout': () => '',
    'system.listMethods': () => [...types.map(type => type + '.get_all_records'), 'event.from', 'event.inject'],
  }

  function call(method, params) {
    const handler = handlers[method]
    if (handler !== undefined) {
      return handler(params)
    }

    const i = method.lastIndexOf('.')
    const type = typesByLcType.get(method.slice(0, i).toLowerCase())
    const action = method.slice(i + 1)
    if (type !== undefined) {
      const records = recordsByType[type]
      if (action === 'get_all_records') {
        return records
      }
      if (action === 'get_record') {
        const record = records[params[1]]
        if (record === undefined) {
          throw new XapiError('HANDLE_INVALID', [type, params[1]])
        }
        return record
      }
    }
    throw new XapiError('MESSAGE_METHOD_UNKNOWN', [method])
  }

  async function handleRequest(req, res) {
    if (req.method !== 'POST' || req.url !== '/jsonrpc') {
      res.writeHead(404).end()
      return
    }

    let body = ''
    for await (const chunk of req) {
      body += chunk
    }
    const { id, method, params = [] } = JSON.parse(body)

    let response
    try {
      response = { jsonrpc: '2.0', id, result: await call(method, params) }
    } catch (error) {
      if (!(error instanceof XapiError)) {
        throw error
      }
      // XAPI puts the error code in `message` and its params in `data`
      response = { jsonrpc: '2.0', id, error: { code: 1, message: error.code, data: error.params } }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(response))
  }

  const server = createServer((req, res) => {
    handleRequest(req, res).catch(error => {
      if (!abortController.signal.aborted) {
        warn('request failed', { error })
      }
      res.destroy()
    })
  })
  server.listen(port, host)
  await once(server, 'listening')

  return {
    url: `http://${host}:${server.address().port}`,
    async close() {
      abortController.abort()
      server.closeAllConnections()
      server.close()
      await once(server, 'close')
    },
  }
}
