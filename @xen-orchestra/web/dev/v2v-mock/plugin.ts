import type { XoV2vInventoryPayload, XoV2vStatus } from '@vates/types'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { createMockInventory } from './fixtures.ts'

type V2vMockOptions = {
  enabled: boolean
  vecturaError?: string
}

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
}

async function readJson<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = []

  for await (const chunk of request) {
    chunks.push(chunk as Buffer)
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T
}

async function handleInventory(request: IncomingMessage, response: ServerResponse) {
  const { connection } = await readJson<XoV2vInventoryPayload>(request)

  if (connection.password === 'bad') {
    sendJson(response, 422, { error: 'invalid credentials', data: { code: 'V2V_INVALID_CREDENTIALS' } })

    return
  }

  if (connection.host === 'unreachable.lab') {
    sendJson(response, 500, { error: `${connection.host}:${connection.port} is unreachable` })

    return
  }

  // A real inventory takes a while: let the "connecting" state show
  await new Promise(resolve => setTimeout(resolve, 800))

  sendJson(response, 200, createMockInventory(connection.host))
}

// Stands in for the V2V REST routes until the back end ships them (dev server only, never built)
export function v2vMockPlugin({ enabled, vecturaError }: V2vMockOptions): Plugin {
  return {
    name: 'xo-v2v-mock',
    apply: (_config, { command }) => enabled && command === 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const { pathname } = new URL(request.url ?? '/', 'http://localhost')

        if (pathname === '/rest/v0/v2v/status' && request.method === 'GET') {
          const status: XoV2vStatus = {
            vectura: vecturaError ? { status: 'error', error: vecturaError } : { status: 'success' },
          }

          sendJson(response, 200, status)

          return
        }

        if (pathname === '/rest/v0/v2v/actions/inventory' && request.method === 'POST') {
          handleInventory(request, response).catch(next)

          return
        }

        next()
      })
    },
  }
}
