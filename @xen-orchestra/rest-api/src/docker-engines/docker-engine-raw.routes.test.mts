import assert from 'node:assert/strict'
import { createServer, request as httpRequest, type Server } from 'node:http'
import { Readable } from 'node:stream'
import { after, before, beforeEach, describe, it } from 'node:test'
import express, { type NextFunction, type Request, type Response } from 'express'
import type { OpenAPIV3 } from 'openapi-types'
import { featureUnauthorized, noSuchObject } from 'xo-common/api-errors.js'

import {
  DOCKER_RAW_ENDPOINT,
  DOCKER_RAW_SPEC_PATH,
  dockerRawHandler,
  getRawPathSegments,
  mountDockerRawRoutes,
} from './docker-engine-raw.routes.mjs'
import genericErrorHandler from '../middlewares/generic-error-handler.middleware.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'
import type { RouteDefinition } from '../router/types.mjs'

const ENGINE_ID = 'a1ea0bb5-f67d-4406-8d9b-6a4c2fa8c6ac'
const VM_ID = 'c7b3b4bc-0000-4000-8000-000000000001'

type RawCall = { id: string; method: string; path: string; headers: Record<string, string>; body?: string }
type Upstream = { statusCode: number; headers: Record<string, string>; body: Readable }

// state of the fake xo-server, reset before each test
const state = {
  allowRawApi: true as boolean | undefined,
  licensed: true,
  user: { id: 'admin-id', email: 'admin@example.org', permission: 'admin' } as {
    id: string
    email: string
    permission: string
  },
  calls: [] as RawCall[],
  upstream: (): Upstream => ({
    statusCode: 200,
    headers: { 'content-type': 'application/json', 'api-version': '1.43', server: 'Docker/29', 'x-secret': 'no' },
    body: Readable.from(['[]']),
  }),
  error: undefined as Error | undefined,
}

const restApi = {
  getCurrentUser: () => state.user,
  xoApp: {
    config: {
      getOptional: (path: string) => (path === 'docker.allowRawApi' ? state.allowRawApi : undefined),
    },
    checkFeatureAuthorization: async () => {
      if (!state.licensed) {
        throw featureUnauthorized({ featureCode: 'DOCKER' })
      }
    },
    getDockerEngine: async (id: string) => {
      if (id !== ENGINE_ID) {
        throw noSuchObject(id, 'docker-engine')
      }
      return { id, $VM: VM_ID }
    },
    callDockerEngineRawApi: async (
      id: string,
      {
        method,
        path,
        headers,
        body,
      }: { method: string; path: string; headers: Record<string, string>; body?: Readable }
    ) => {
      const call: RawCall = { id, method, path, headers }
      state.calls.push(call)
      if (body !== undefined) {
        const chunks: Buffer[] = []
        for await (const chunk of body) {
          chunks.push(chunk)
        }
        call.body = Buffer.concat(chunks).toString()
      }
      if (state.error !== undefined) {
        throw state.error
      }
      return state.upstream()
    },
  },
} as unknown as RestApi

let server: Server
let port: number

before(async () => {
  const app = express()
  app.all(`/rest/v0${DOCKER_RAW_ENDPOINT}`, (req: Request, res: Response, next: NextFunction) => {
    // what the external router does with the callback's errors
    dockerRawHandler({ req, res, restApi }).catch(next)
  })
  app.use(genericErrorHandler)
  server = createServer(app)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  port = (server.address() as { port: number }).port
})

after(() => new Promise<void>(resolve => server.close(() => resolve())))

beforeEach(() => {
  state.allowRawApi = true
  state.licensed = true
  state.user = { id: 'admin-id', email: 'admin@example.org', permission: 'admin' }
  state.calls = []
  state.error = undefined
  state.upstream = () => ({
    statusCode: 200,
    headers: { 'content-type': 'application/json', 'api-version': '1.43', server: 'Docker/29', 'x-secret': 'no' },
    body: Readable.from(['[]']),
  })
})

// raw HTTP request: fetch() would normalize the path (`..`) and forbid some headers
function send(
  path: string,
  { method = 'GET', headers = {}, body }: { method?: string; headers?: Record<string, string>; body?: string } = {}
): Promise<{ status: number; headers: Record<string, unknown>; body: string; error?: Error }> {
  return new Promise(resolve => {
    const req = httpRequest({ host: '127.0.0.1', port, method, path: `/rest/v0/docker-engines/${path}`, headers })
    req.on('response', res => {
      const chunks: Buffer[] = []
      res.on('data', chunk => chunks.push(chunk))
      const done = (error?: Error) =>
        resolve({ status: res.statusCode!, headers: res.headers, body: Buffer.concat(chunks).toString(), error })
      res.on('end', () => done())
      res.on('error', done)
      res.on('aborted', () => done(new Error('aborted')))
    })
    req.on('error', error => resolve({ status: 0, headers: {}, body: '', error }))
    req.end(body)
  })
}

describe('raw Docker API passthrough', () => {
  it('501 when disabled (the default), before anything else', async () => {
    for (const value of [undefined, false]) {
      state.allowRawApi = value
      state.user = { id: 'u', email: 'u@example.org', permission: 'none' }
      const res = await send(`${ENGINE_ID}/_raw/version`)
      assert.equal(res.status, 501)
      assert.match(res.body, /docker\.allowRawApi/)
    }
    assert.deepEqual(state.calls, [])
  })

  it('403 for a non-admin user, before any other check (the manual admin check)', async () => {
    for (const permission of ['none', 'viewer', 'operator']) {
      state.user = { id: 'u', email: 'u@example.org', permission }
      state.licensed = false
      // even with an unknown engine: nothing is disclosed
      for (const id of [ENGINE_ID, 'unknown']) {
        const res = await send(`${id}/_raw/version`)
        assert.equal(res.status, 403, `${permission} ${id}`)
      }
    }
    assert.deepEqual(state.calls, [])
  })

  it('the DOCKER feature, then 404 on an unknown engine', async () => {
    state.licensed = false
    assert.equal((await send(`${ENGINE_ID}/_raw/version`)).status, 403)
    state.licensed = true
    assert.equal((await send('unknown/_raw/version')).status, 404)
    assert.deepEqual(state.calls, [])
  })

  it('attach, exec start and upgrades are refused (501), even encoded or versioned', async () => {
    for (const path of [
      'containers/abc/attach?stream=1',
      'containers/abc/attach/ws',
      'v1.43/containers/abc/attach',
      'containers/abc/%61ttach',
      'exec/123/start',
      'v1.41/exec/123/start',
      'session',
      'grpc',
    ]) {
      const res = await send(`${ENGINE_ID}/_raw/${path}`, { method: 'POST' })
      assert.equal(res.status, 501, path)
    }
    const upgrade = await send(`${ENGINE_ID}/_raw/containers/json`, {
      headers: { connection: 'Upgrade', upgrade: 'tcp' },
    })
    assert.equal(upgrade.status, 501)
    assert.deepEqual(state.calls, [])
  })

  it('`..`, `.`, empty segments and encoded slashes are refused (400)', async () => {
    for (const path of [
      '../../info',
      'containers/../../info',
      'containers/%2e%2e/info',
      'containers/%2E%2e/info',
      'containers/./json',
      'containers%2fjson',
      'containers%2Fjson',
      'containers%5cjson',
      'containers//json',
      'containers/%00/json',
      '',
    ]) {
      const res = await send(`${ENGINE_ID}/_raw/${path}`)
      assert.equal(res.status, 400, path)
    }
    assert.deepEqual(state.calls, [])
  })

  it('forwards the path and query verbatim, only allowlisted headers both ways', async () => {
    const res = await send(`${ENGINE_ID}/_raw/images/json?all=1&filters=%7B%22dangling%22%3A%5B%22true%22%5D%7D`, {
      headers: {
        accept: 'application/json',
        cookie: 'authenticationToken=secret-token',
        authorization: 'Basic c2VjcmV0OnNlY3JldA==',
        'x-xo-client': 'mcp',
        'x-registry-auth': 'secret',
        'x-forwarded-for': '1.2.3.4',
      },
    })
    assert.equal(res.status, 200)
    assert.equal(res.body, '[]')
    assert.deepEqual(state.calls, [
      {
        id: ENGINE_ID,
        method: 'GET',
        path: '/images/json?all=1&filters=%7B%22dangling%22%3A%5B%22true%22%5D%7D',
        headers: { accept: 'application/json' },
      },
    ])
    assert.equal(res.headers['api-version'], '1.43')
    assert.match(String(res.headers['content-type']), /^application\/json/)
    assert.equal(res.headers.server, undefined)
    assert.equal(res.headers['x-secret'], undefined)
  })

  it('forwards bodies with their content type, and the upstream status', async () => {
    state.upstream = () => ({
      statusCode: 404,
      headers: { 'content-type': 'application/json' },
      body: Readable.from(['{"message":"No such image"}']),
    })
    const body = JSON.stringify({ Image: 'alpine' })
    const res = await send(`${ENGINE_ID}/_raw/containers/create?name=foo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': String(body.length), cookie: 'token=x' },
      body,
    })
    assert.equal(res.status, 404)
    assert.equal(res.body, '{"message":"No such image"}')
    assert.deepEqual(state.calls, [
      {
        id: ENGINE_ID,
        method: 'POST',
        path: '/containers/create?name=foo',
        headers: { 'content-type': 'application/json', 'content-length': String(body.length) },
        body,
      },
    ])
  })

  it('size caps: 413 for the request body, 502 for an announced response, cut when streamed', async () => {
    const dockerError = (code: string) =>
      Object.assign(new Error(code), { name: 'DockerError', code, data: { maxSize: 10 } })

    state.error = dockerError('RAW_REQUEST_TOO_LARGE')
    let res = await send(`${ENGINE_ID}/_raw/build`, { method: 'POST', body: 'x'.repeat(100) })
    assert.equal(res.status, 413)
    assert.equal(JSON.parse(res.body).data.code, 'RAW_REQUEST_TOO_LARGE')

    state.error = dockerError('RAW_RESPONSE_TOO_LARGE')
    res = await send(`${ENGINE_ID}/_raw/images/json`)
    assert.equal(res.status, 502)
    assert.equal(JSON.parse(res.body).data.code, 'RAW_RESPONSE_TOO_LARGE')

    // the body fails after the headers: the response is cut
    state.error = undefined
    state.upstream = () => ({
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: Readable.from(
        (async function* () {
          yield '[{"Id":"a"},'
          await new Promise(resolve => setTimeout(resolve, 10))
          throw dockerError('RAW_RESPONSE_TOO_LARGE')
        })()
      ),
    })
    res = await send(`${ENGINE_ID}/_raw/containers/json`)
    assert.equal(res.status, 200)
    assert.ok(res.error !== undefined, 'the response is not complete')
    assert.equal(res.body, '[{"Id":"a"},')
  })

  it('SSH/Docker errors are mapped', async () => {
    state.error = Object.assign(new Error('SSH authentication failed'), {
      name: 'DockerError',
      code: 'SSH_AUTH_FAILED',
    })
    const res = await send(`${ENGINE_ID}/_raw/version`)
    assert.equal(res.status, 502)
    assert.equal(JSON.parse(res.body).data.code, 'SSH_AUTH_FAILED')
  })
})

describe('getRawPathSegments()', () => {
  it('decodes the segments', () => {
    assert.deepEqual(getRawPathSegments('images/foo%3Alatest/json'), ['images', 'foo:latest', 'json'])
    assert.equal(getRawPathSegments('a/%2E'), undefined)
    // (through express, an invalid encoding is already refused when decoding the route params)
    assert.equal(getRawPathSegments('a/%zz'), undefined)
  })
})

describe('mountDockerRawRoutes()', () => {
  it('mounts 5 methods and replaces the wildcard path with the hand-written entry (x-mcp-exposure deny)', () => {
    const spec = { paths: {} } as OpenAPIV3.Document
    const mounted: RouteDefinition[] = []
    // what the external router does: adds the endpoint as is to the spec
    const mountExternalRoute = (route: RouteDefinition) => {
      mounted.push(route)
      spec.paths[route.endpoint] = { ...spec.paths[route.endpoint], [route.method]: { responses: {} } }
      return () => {}
    }
    mountDockerRawRoutes(mountExternalRoute, spec)
    assert.deepEqual(
      mounted.map(_ => [_.method, _.endpoint]),
      ['get', 'post', 'put', 'patch', 'delete'].map(method => [method, '/docker-engines/:id/_raw/*'])
    )
    assert.deepEqual(Object.keys(spec.paths), [DOCKER_RAW_SPEC_PATH])
    const pathItem = spec.paths[DOCKER_RAW_SPEC_PATH] as Record<string, Record<string, unknown>>
    assert.deepEqual(Object.keys(pathItem), ['get', 'post', 'put', 'patch', 'delete'])
    for (const operation of Object.values(pathItem)) {
      assert.equal(operation['x-mcp-exposure'], 'deny')
      assert.match(String(operation.operationId), /^DockerEngineRaw/)
    }
  })
})
