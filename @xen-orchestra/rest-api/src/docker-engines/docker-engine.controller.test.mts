import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { serializeError } from '@vates/task'
import { noSuchObject } from 'xo-common/api-errors.js'

import { DockerEngineController } from './docker-engine.controller.mjs'
import { ApiError } from '../helpers/error.helper.mjs'
import { toDockerApiError } from '../helpers/docker.helper.mjs'
import genericErrorHandler from '../middlewares/generic-error-handler.middleware.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'

const ENGINE_ID = 'a1ea0bb5-f67d-4406-8d9b-6a4c2fa8c6ac'
const SECRETS = {
  password: 'secret-password-value',
  privateKey: '-----BEGIN OPENSSH PRIVATE KEY-----\nsecret-private-key-value\n-----END OPENSSH PRIVATE KEY-----\n',
  passphrase: 'secret-passphrase-value',
}

class DockerError extends Error {
  code: string
  data?: Record<string, unknown>
  constructor(code: string, message: string, data?: Record<string, unknown>) {
    super(message)
    this.name = 'DockerError'
    this.code = code
    this.data = data
  }
}

const engine = {
  id: ENGINE_ID,
  port: 22,
  username: 'xo',
  socketPath: '/var/run/docker.sock',
  hasPassword: true,
  hasPrivateKey: true,
  connectionStatus: 'idle',
}

type Task = { id: string; properties: Record<string, unknown>; result?: unknown }

// what the Tasks mixin of xo-server records on failure (`@vates/task`): the
// error itself if it has a `toJSON()`, otherwise `serializeError(error)`
const recordError = (error: unknown) => (error instanceof Error && !('toJSON' in error) ? serializeError(error) : error)

function setup({ xoApp: xoAppOverrides = {} }: { xoApp?: object } = {}) {
  const calls: { method: string; args: unknown[] }[] = []
  const tasks: Task[] = []
  const record =
    (method: string, result: (...args: unknown[]) => unknown) =>
    async (...args: unknown[]) => {
      calls.push({ method, args })
      return result(...args)
    }
  const xoApp = {
    getAllDockerEngines: record('getAllDockerEngines', () => [engine]),
    getDockerEngine: record('getDockerEngine', id => {
      if (id !== ENGINE_ID) {
        throw noSuchObject(id, 'docker-engine')
      }
      return engine
    }),
    createDockerEngine: record('createDockerEngine', () => engine),
    updateDockerEngine: record('updateDockerEngine', () => engine),
    deleteDockerEngine: record('deleteDockerEngine', () => undefined),
    getDockerEngineInfo: record('getDockerEngineInfo', () => ({ status: 'connected', asOf: 0 })),
    testDockerEngine: record('testDockerEngine', () => ({ ok: true, fingerprint: 'SHA256:x' })),
    ...xoAppOverrides,
  }
  const restApi = {
    xoApp,
    getCurrentUser: () => ({ id: 'admin', permission: 'admin' }),
    tasks: {
      create: (properties: Record<string, unknown>) => {
        const task: Task = { id: `task-${tasks.length}`, properties }
        tasks.push(task)
        return {
          id: task.id,
          set: (name: string, value: unknown) => {
            properties[name] = value
          },
          run: async (fn: () => unknown) => {
            try {
              return (task.result = await fn())
            } catch (error) {
              task.result = recordError(error)
              throw error
            }
          },
        }
      },
    },
  } as unknown as RestApi
  const controller = new DockerEngineController(restApi)
  return { calls, controller, tasks }
}

const CONNECTION_CONTEXT = { host: '192.0.2.1', port: 2222, socketPath: '/run/user/1000/docker.sock' }

// everything a task record could persist, readable with task:read
const assertNoSecrets = (tasks: Task[]) => {
  assert.ok(tasks.length > 0)
  const serialized = JSON.stringify(tasks.map(({ properties, result }) => ({ properties, result })))
  for (const [name, value] of Object.entries(SECRETS)) {
    assert.equal(serialized.includes(value), false, `${name} found in a task record`)
  }
  // not even a fragment
  assert.equal(serialized.includes('secret-'), false, 'a fragment of a secret found in a task record')
  for (const [name, value] of Object.entries(CONNECTION_CONTEXT)) {
    assert.equal(serialized.includes(String(value)), false, `${name} found in a task record`)
  }
  assert.equal(serialized.includes('"cause"'), false, 'the raw error found in a task record')
}

// what the client receives, through the generic error handler
function respond(error: unknown) {
  const res = {
    status: 0,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
  }
  const fakeRes = {
    headersSent: false,
    setHeader: (name: string, value: string) => (res.headers[name] = value),
    status: (code: number) => {
      res.status = code
      return fakeRes
    },
    json: (value: unknown) => (res.body = value),
  }
  genericErrorHandler(error, { method: 'POST', path: '/docker-engines' } as never, fakeRes as never, () => {})
  return res
}

describe('DockerEngineController', () => {
  describe('create, update and delete: no task, whose record would be readable with task:read', () => {
    it('create', async () => {
      const { calls, controller, tasks } = setup()
      const body = { host: '192.0.2.1', username: 'xo', ...SECRETS, hostKeyFingerprint: 'SHA256:x' }
      assert.deepEqual(await controller.createDockerEngine(body), { id: ENGINE_ID })
      // the mixin gets the real secrets
      assert.deepEqual(calls, [{ method: 'createDockerEngine', args: [body] }])
      assert.deepEqual(tasks, [])
    })

    it('create which fails: the HTTP answer is the error (TOFU 409 with the observed fingerprint)', async () => {
      const error = new DockerError('HOST_KEY_UNKNOWN', 'unknown host key', {
        host: '192.0.2.1',
        port: 22,
        fingerprint: 'SHA256:x',
        algorithm: 'ssh-ed25519',
      })
      const { controller, tasks } = setup({
        xoApp: {
          createDockerEngine: async () => {
            throw error
          },
        },
      })
      await assert.rejects(controller.createDockerEngine({ username: 'xo', host: 'h', ...SECRETS }), _ => _ === error)
      assert.deepEqual(tasks, [])
      assert.deepEqual(respond(error), {
        status: 409,
        headers: {},
        body: {
          error: 'unknown host key',
          data: { code: 'HOST_KEY_UNKNOWN', fingerprint: 'SHA256:x', algorithm: 'ssh-ed25519' },
        },
      })
    })

    it('update', async () => {
      const { calls, controller, tasks } = setup()
      const body = { privateKey: SECRETS.privateKey, passphrase: SECRETS.passphrase, password: null }
      await controller.updateDockerEngine(ENGINE_ID, body)
      assert.deepEqual(calls, [{ method: 'updateDockerEngine', args: [ENGINE_ID, body] }])
      assert.deepEqual(tasks, [])
    })

    it('update which fails to connect: the error of the creation', async () => {
      for (const [code, status] of [
        ['SSH_AUTH_FAILED', 502],
        ['HOST_KEY_MISMATCH', 409],
        ['SSH_COOLDOWN', 429],
      ] as const) {
        const error = new DockerError(code, code, { retryAfter: 3 })
        const { controller, tasks } = setup({
          xoApp: {
            updateDockerEngine: async () => {
              throw error
            },
          },
        })
        await assert.rejects(
          controller.updateDockerEngine(ENGINE_ID, { privateKey: SECRETS.privateKey }),
          _ => _ === error
        )
        assert.deepEqual(tasks, [])
        const res = respond(error)
        assert.equal(res.status, status, code)
        assert.equal((res.body as { data: { code: string } }).data.code, code)
      }
    })

    it('delete', async () => {
      const { calls, controller, tasks } = setup()
      await controller.deleteDockerEngine(ENGINE_ID)
      assert.deepEqual(calls, [{ method: 'deleteDockerEngine', args: [ENGINE_ID] }])
      assert.deepEqual(tasks, [])
    })
  })

  it('test which fails: the task record holds the mapped error, without connection context', async () => {
    const { controller, tasks } = setup({
      xoApp: {
        testDockerEngine: async () => {
          throw new DockerError('TIMEOUT', 'timed out', { ...CONNECTION_CONTEXT, timeout: 30e3 })
        },
      },
    })
    await assert.rejects(controller.testDockerEngine(ENGINE_ID, true), ApiError)
    assertNoSecrets(tasks)
    assert.deepEqual(JSON.parse(JSON.stringify(tasks[0].result)), {
      code: 'TIMEOUT',
      timeout: 30e3,
      message: 'timed out',
    })
  })

  it('test: no secrets in the task record', async () => {
    const { controller, tasks } = setup()
    assert.deepEqual(await controller.testDockerEngine(ENGINE_ID, true), { ok: true, fingerprint: 'SHA256:x' })
    assertNoSecrets(tasks)
    assert.equal(tasks[0].properties.params, undefined)
  })

  it('test: 404 before creating a task', async () => {
    const { controller, tasks } = setup()
    await assert.rejects(controller.testDockerEngine('nope'), noSuchObject.is)
    assert.deepEqual(tasks, [])
  })

  it('info: connection problems are a status, not an HTTP error', async () => {
    const info = { status: 'auth-failed', asOf: 1, error: { code: 'SSH_AUTH_FAILED', message: 'x' } }
    const { controller } = setup({ xoApp: { getDockerEngineInfo: async () => info } })
    assert.deepEqual(await controller.getDockerEngineInfo(ENGINE_ID), info)
  })
})

describe('toDockerApiError()', () => {
  const statusOf = (code: string, data?: Record<string, unknown>) =>
    (toDockerApiError(new DockerError(code, 'message', data)) as ApiError).status

  it('maps the DockerError codes to HTTP statuses', () => {
    assert.equal(statusOf('HOST_KEY_UNKNOWN'), 409)
    assert.equal(statusOf('HOST_KEY_MISMATCH'), 409)
    // never 401: it would make the browser prompt for XO credentials
    assert.equal(statusOf('SSH_AUTH_FAILED'), 502)
    assert.equal(statusOf('SSH_UNREACHABLE'), 502)
    assert.equal(statusOf('SSH_ERROR'), 502)
    assert.equal(statusOf('SSH_REFUSED_PENALTY'), 502)
    assert.equal(statusOf('SSH_COOLDOWN', { retryAfter: 7 }), 429)
    assert.equal(statusOf('DOCKER_SOCKET_UNREACHABLE'), 502)
    assert.equal(statusOf('STREAM_LOCAL_UNSUPPORTED'), 502)
    assert.equal(statusOf('DOCKER_API_VERSION_UNSUPPORTED'), 502)
    assert.equal(statusOf('TIMEOUT'), 504)
    assert.equal(statusOf('POOL_EXHAUSTED'), 503)
    assert.equal(statusOf('CONNECTION_CLOSED'), 503)
    assert.equal(statusOf('DOCKER_API_ERROR', { statusCode: 409 }), 409)
    assert.equal(statusOf('DOCKER_API_ERROR', { statusCode: 500 }), 502)
    assert.equal(statusOf('DOCKER_API_ERROR'), 502)
  })

  it("never passes the daemon's authentication errors through, only an allowlist of 4xx (review 3)", () => {
    for (const statusCode of [400, 404, 409]) {
      assert.equal(statusOf('DOCKER_API_ERROR', { statusCode }), statusCode)
    }
    // 401/407 would make a browser or a proxy prompt for credentials, 403
    // would look like a missing XO permission
    for (const statusCode of [401, 403, 405, 406, 407, 413, 418, 429, 451, 499]) {
      const error = toDockerApiError(new DockerError('DOCKER_API_ERROR', 'nope', { statusCode })) as ApiError
      assert.equal(error.status, 502, String(statusCode))
      assert.equal(error.data?.statusCode, statusCode, 'the upstream status is kept in data')
    }
  })

  it('DOCKER_API_ERROR: only code, statusCode and a truncated message reach the client (review 3)', () => {
    const message = 'x'.repeat(10e3)
    const error = toDockerApiError(
      new DockerError('DOCKER_API_ERROR', message, {
        host: '192.0.2.1',
        port: 2222,
        socketPath: '/run/user/1000/docker.sock',
        path: '/containers/abc/json',
        statusCode: 404,
        message,
      })
    ) as ApiError
    assert.equal(error.status, 404)
    assert.deepEqual(Object.keys(error.data!).sort(), ['code', 'message', 'statusCode'])
    assert.equal(error.data!.code, 'DOCKER_API_ERROR')
    assert.equal(error.data!.statusCode, 404)
    assert.ok((error.data!.message as string).length <= 1024)
    assert.ok(error.message.length <= 1024)
    assert.doesNotMatch(JSON.stringify({ message: error.message, data: error.data }), /192\.0\.2\.1|2222|docker\.sock/)
  })

  it('other errors: the connection context (host, port, socketPath, path) is not copied (review 3)', () => {
    const error = toDockerApiError(
      new DockerError('TIMEOUT', 'timed out', {
        host: '192.0.2.1',
        port: 2222,
        socketPath: '/run/user/1000/docker.sock',
        path: '/containers/abc/json',
        timeout: 30e3,
      })
    ) as ApiError
    assert.deepEqual(error.data, { code: 'TIMEOUT', timeout: 30e3 })
    const hostKey = toDockerApiError(
      new DockerError('HOST_KEY_UNKNOWN', 'unknown', {
        host: '192.0.2.1',
        port: 22,
        fingerprint: 'SHA256:x',
        algorithm: 'ssh-ed25519',
      })
    ) as ApiError
    assert.deepEqual(hostKey.data, { code: 'HOST_KEY_UNKNOWN', fingerprint: 'SHA256:x', algorithm: 'ssh-ed25519' })
  })

  it('keeps the data, with the code', () => {
    const error = toDockerApiError(
      new DockerError('DOCKER_SOCKET_UNREACHABLE', 'message', { diagnostic: { code: 'socket-missing' } })
    ) as ApiError
    assert.equal(error.message, 'message')
    assert.deepEqual(error.data, { code: 'DOCKER_SOCKET_UNREACHABLE', diagnostic: { code: 'socket-missing' } })
  })

  it('other errors are returned as is', () => {
    let error: unknown
    try {
      // xo-common's factories throw
      noSuchObject('x', 'docker-engine')
    } catch (_error) {
      error = _error
    }
    assert.ok(noSuchObject.is(error))
    assert.equal(toDockerApiError(error), error)
    const plain = Object.assign(new Error('x'), { code: 'SSH_AUTH_FAILED' })
    assert.equal(toDockerApiError(plain), plain)
  })

  it('POOL_EXHAUSTED: 503 with a Retry-After header', () => {
    const headers: Record<string, string> = {}
    let status: number | undefined
    let body: unknown
    const res = {
      headersSent: false,
      setHeader: (name: string, value: string) => (headers[name] = value),
      status: (code: number) => {
        status = code
        return res
      },
      json: (value: unknown) => (body = value),
    }
    // mapped by the generic error handler itself
    genericErrorHandler(
      new DockerError('POOL_EXHAUSTED', 'too many connections'),
      { method: 'GET', path: '/docker-engines/x/info' } as never,
      res as never,
      () => {}
    )
    assert.equal(status, 503)
    assert.deepEqual(headers, { 'Retry-After': '5' })
    assert.deepEqual(body, { error: 'too many connections', data: { code: 'POOL_EXHAUSTED' } })
  })

  it('SSH_COOLDOWN: 429 with Retry-After from data.retryAfter (fixes)', () => {
    const error = toDockerApiError(
      new DockerError('SSH_COOLDOWN', 'retry in 7 s', { retryAfter: 7, lastCode: 'SSH_AUTH_FAILED' })
    ) as ApiError & { headers?: Record<string, string> }
    assert.equal(error.status, 429)
    assert.deepEqual(error.data, { code: 'SSH_COOLDOWN', retryAfter: 7, lastCode: 'SSH_AUTH_FAILED' })
    const headers: Record<string, string> = {}
    const res = {
      headersSent: false,
      setHeader: (name: string, value: string) => (headers[name] = value),
      status: () => res,
      json: () => {},
    }
    genericErrorHandler(error, { method: 'POST', path: '/docker-engines' } as never, res as never, () => {})
    assert.deepEqual(headers, { 'Retry-After': '7' })
  })
})
