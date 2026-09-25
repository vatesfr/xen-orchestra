import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { featureUnauthorized, noSuchObject } from 'xo-common/api-errors.js'

import { DockerEngineController } from './docker-engine.controller.mjs'
import { DockerEngineService } from './docker-engine.service.mjs'
import { ApiError } from '../helpers/error.helper.mjs'
import { OBFUSCATED, toDockerApiError } from '../helpers/docker.helper.mjs'
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

type Task = { id: string; properties: Record<string, unknown>; result?: unknown; error?: unknown }

function setup({ licensed = true, xoApp: xoAppOverrides = {} }: { licensed?: boolean; xoApp?: object } = {}) {
  const calls: { method: string; args: unknown[] }[] = []
  const tasks: Task[] = []
  const record =
    (method: string, result: (...args: unknown[]) => unknown) =>
    async (...args: unknown[]) => {
      calls.push({ method, args })
      return result(...args)
    }
  const xoApp = {
    checkFeatureAuthorization: async () => {
      if (!licensed) {
        throw featureUnauthorized({ featureCode: 'DOCKER' })
      }
    },
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
              task.error = error
              throw error
            }
          },
        }
      },
    },
  } as unknown as RestApi
  const controller = new DockerEngineController(restApi, new DockerEngineService(restApi))
  return { calls, controller, tasks }
}

// everything a task record could persist
const assertNoSecrets = (tasks: Task[]) => {
  assert.ok(tasks.length > 0)
  const serialized = JSON.stringify(tasks.map(({ properties, result }) => ({ properties, result })))
  for (const [name, value] of Object.entries(SECRETS)) {
    assert.equal(serialized.includes(value), false, `${name} found in a task record`)
  }
  // not even a fragment
  assert.equal(serialized.includes('secret-'), false, 'a fragment of a secret found in a task record')
}

describe('DockerEngineController', () => {
  describe('no secrets in task records', () => {
    it('create', async () => {
      const { calls, controller, tasks } = setup()
      const body = { host: '192.0.2.1', username: 'xo', ...SECRETS, hostKeyFingerprint: 'SHA256:x' }
      assert.deepEqual(await controller.createDockerEngine(body), { id: ENGINE_ID })

      // the mixin gets the real secrets
      assert.deepEqual(calls, [{ method: 'createDockerEngine', args: [body] }])
      assertNoSecrets(tasks)
      assert.deepEqual(tasks[0].properties.params, {
        host: '192.0.2.1',
        username: 'xo',
        password: OBFUSCATED,
        privateKey: OBFUSCATED,
        passphrase: OBFUSCATED,
        hostKeyFingerprint: 'SHA256:x',
      })
      assert.equal(tasks[0].properties.objectId, ENGINE_ID, 'set once created')
      assert.equal(tasks[0].properties.objectType, 'docker-engine')
    })

    it('create which fails', async () => {
      const { controller, tasks } = setup({
        xoApp: {
          createDockerEngine: async () => {
            throw new DockerError('HOST_KEY_UNKNOWN', 'unknown host key', {
              fingerprint: 'SHA256:x',
              algorithm: 'ssh-ed25519',
            })
          },
        },
      })
      await assert.rejects(controller.createDockerEngine({ username: 'xo', host: 'h', ...SECRETS }), error => {
        assert.ok(error instanceof ApiError)
        assert.equal(error.status, 409)
        assert.deepEqual(error.data, { code: 'HOST_KEY_UNKNOWN', fingerprint: 'SHA256:x', algorithm: 'ssh-ed25519' })
        return true
      })
      assertNoSecrets(tasks)
    })

    it('update, clearing a secret is kept visible', async () => {
      const { calls, controller, tasks } = setup()
      const body = { privateKey: SECRETS.privateKey, passphrase: SECRETS.passphrase, password: null }
      await controller.updateDockerEngine(ENGINE_ID, body)
      assert.deepEqual(calls, [{ method: 'updateDockerEngine', args: [ENGINE_ID, body] }])
      assertNoSecrets(tasks)
      assert.deepEqual(tasks[0].properties.params, { privateKey: OBFUSCATED, passphrase: OBFUSCATED, password: null })
    })

    it('update which fails to connect: the error of the creation, no secret (fixes)', async () => {
      for (const [code, status] of [
        ['SSH_AUTH_FAILED', 502],
        ['HOST_KEY_MISMATCH', 409],
        ['SSH_COOLDOWN', 429],
      ] as const) {
        const { controller, tasks } = setup({
          xoApp: {
            updateDockerEngine: async () => {
              throw new DockerError(code, code, { retryAfter: 3 })
            },
          },
        })
        await assert.rejects(controller.updateDockerEngine(ENGINE_ID, { privateKey: SECRETS.privateKey }), error => {
          assert.ok(error instanceof ApiError)
          assert.equal(error.status, status)
          assert.equal((error.data as { code: string }).code, code)
          return true
        })
        assertNoSecrets(tasks)
      }
    })

    it('test', async () => {
      const { controller, tasks } = setup()
      assert.deepEqual(await controller.testDockerEngine(ENGINE_ID, true), { ok: true, fingerprint: 'SHA256:x' })
      assertNoSecrets(tasks)
      assert.equal(tasks[0].properties.params, undefined)
    })
  })

  it('every route checks the DOCKER feature first', async () => {
    const { calls, controller, tasks } = setup({ licensed: false })
    const req = { query: {}, path: '/rest/v0/docker-engines' } as never
    for (const call of [
      () => controller.getDockerEngines(req),
      () => controller.getDockerEngine(ENGINE_ID),
      () => controller.getDockerEngineInfo(ENGINE_ID),
      () => controller.createDockerEngine({ username: 'xo', host: 'h', ...SECRETS }),
      () => controller.updateDockerEngine(ENGINE_ID, { label: 'x' }),
      () => controller.deleteDockerEngine(ENGINE_ID),
      () => controller.testDockerEngine(ENGINE_ID, true),
    ]) {
      await assert.rejects(call(), featureUnauthorized.is)
    }
    assert.deepEqual(calls, [])
    assert.deepEqual(tasks, [])
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
    genericErrorHandler(
      toDockerApiError(new DockerError('POOL_EXHAUSTED', 'too many connections')),
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
