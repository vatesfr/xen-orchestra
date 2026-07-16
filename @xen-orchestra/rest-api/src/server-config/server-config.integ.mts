import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { AsyncLocalStorage } from 'node:async_hooks'
import { createServer } from 'node:http'
import express from 'express'
import cookieParser from 'cookie-parser'

import { invalidCredentials } from 'xo-common/api-errors.js'
import setupRestApi from '../index.mjs'

const createMockXoApp = () => {
  const storage = new AsyncLocalStorage()

  return {
    get apiContext() {
      return storage.getStore() ?? {}
    },

    authenticateUser: async ({ token }) => {
      if (token !== 'admin-token') {
        throw invalidCredentials()
      }

      return {
        user: {
          id: 'admin',
          permission: 'admin',
        },
      }
    },

    runWithApiContext: (user, fn) => storage.run({ user }, fn),

    config: {
      getFiltered() {
        return {
          redis: {
            uri: '**REDACTED**',
          },
        }
      },

      getSources() {
        return []
      },

      parseSourceFiltered() {
        return Promise.resolve({})
      },
    },
  }
}

const createTestServer = async () => {
  const app = express()
  app.use(cookieParser())

  const xoApp = createMockXoApp()

  setupRestApi(app, xoApp as any)

  const server = createServer(app)

  await new Promise<void>(resolve => {
    server.listen(0, () => resolve())
  })

  const address = server.address()

  if (address === null) {
    throw new Error('Server did not start')
  }

  if (typeof address === 'string') {
    throw new Error(`Unexpected server address: ${address}`)
  }

  return { server, port: address.port }
}

const get = (port: number, path: string, token = 'admin-token') =>
  fetch(`http://127.0.0.1:${port}/rest/v0${path}`, {
    headers: {
      Cookie: `token=${token}`,
    },
  })

describe('server-config', () => {
  let server: ReturnType<typeof createServer>
  let port: number

  before(async () => {
    ;({ server, port } = await createTestServer())
  })

  after(() => {
    server.close()
  })

  it('returns filtered config for an admin user', async () => {
    const response = await get(port, '/server-config')

    assert.equal(response.status, 200)

    const body = (await response.json()) as {
      redis: {
        uri: string
      }
    }

    assert.equal(body.redis.uri, '**REDACTED**')

    assert.equal(JSON.stringify(body).includes('password'), false)
  })
})
