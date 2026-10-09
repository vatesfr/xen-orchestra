import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import { after, before, describe, it } from 'node:test'
import express from 'express'
import { featureUnauthorized } from 'xo-common/api-errors.js'
import type { XoApp } from '@vates/types'

import { RegisterRoutes } from '../open-api/routes/routes.js'
import { setupContainer } from '../ioc/ioc.mjs'
import genericErrorHandler from './generic-error-handler.middleware.mjs'

const state = { licensed: false, dockerCalls: [] as string[] }

// records every access to a Docker method of xo-server
const xoApp = new Proxy(
  {
    apiContext: { user: { id: 'admin', permission: 'admin' } },
    config: { getOptional: () => undefined },
    checkFeatureAuthorization: async (feature: string) => {
      assert.equal(feature, 'DOCKER')
      if (!state.licensed) {
        throw featureUnauthorized({ featureCode: feature })
      }
    },
    getAllDockerEngines: async () => [],
  },
  {
    get(target, name) {
      if (typeof name === 'string' && name.includes('Docker')) {
        state.dockerCalls.push(name)
      }
      return target[name as keyof typeof target]
    },
  }
) as unknown as XoApp

let server: Server
let baseUrl: string

before(async () => {
  setupContainer(xoApp)
  const app = express()
  RegisterRoutes(app)
  app.use(genericErrorHandler)
  server = createServer(app)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}/rest/v0`
})

after(() => new Promise<void>(resolve => server.close(() => resolve())))

const ENGINE_ID = 'a1ea0bb5-f67d-4406-8d9b-6a4c2fa8c6ac'
const CONTAINER_ID = `${ENGINE_ID}_${'ab'.repeat(32)}`

describe('dockerFeatureMiddleware', () => {
  it('unlicensed: 403 on every Docker route, before any Docker method of xo-server', async () => {
    state.licensed = false
    state.dockerCalls = []
    for (const [method, path, body] of [
      ['GET', '/docker-engines'],
      ['GET', `/docker-engines/${ENGINE_ID}`],
      ['GET', `/docker-engines/${ENGINE_ID}/info`],
      // before the body is even parsed or validated
      ['POST', '/docker-engines', { host: 'h', username: 'xo', password: 'secret' }],
      ['PATCH', `/docker-engines/${ENGINE_ID}`, { label: 'x' }],
      ['DELETE', `/docker-engines/${ENGINE_ID}`],
      ['POST', `/docker-engines/${ENGINE_ID}/actions/test?sync=true`],
      ['GET', `/docker-containers?filter=${encodeURIComponent('$VM:x')}`],
      ['GET', `/docker-containers/${CONTAINER_ID}`],
      ['GET', `/docker-containers/${CONTAINER_ID}/logs`],
      ['GET', `/docker-containers/${CONTAINER_ID}/stats`],
      ['POST', `/docker-containers/${CONTAINER_ID}/actions/start`],
      ['DELETE', `/docker-containers/${CONTAINER_ID}`],
    ] as const) {
      const res = await fetch(baseUrl + path, {
        method,
        headers: body === undefined ? {} : { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      assert.equal(res.status, 403, `${method} ${path}`)
      assert.equal(((await res.json()) as { data: { featureCode: string } }).data.featureCode, 'DOCKER')
    }
    assert.deepEqual(state.dockerCalls, [])
  })

  it('licensed: the handler is reached', async () => {
    state.licensed = true
    state.dockerCalls = []
    const res = await fetch(`${baseUrl}/docker-engines`)
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), [])
    assert.deepEqual(state.dockerCalls, ['getAllDockerEngines'])
  })
})
