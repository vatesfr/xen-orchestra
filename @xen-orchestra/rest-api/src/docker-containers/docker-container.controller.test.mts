import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { featureUnauthorized, invalidParameters, noSuchObject } from 'xo-common/api-errors.js'

import { DockerContainerController } from './docker-container.controller.mjs'
import { DockerContainerService, getEngineScope } from './docker-container.service.mjs'
import { DockerEngineService } from '../docker-engines/docker-engine.service.mjs'
import { ApiError } from '../helpers/error.helper.mjs'
import { safeParseComplexMatcher } from '../helpers/utils.helper.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'

const VM_1 = 'c7b3b4bc-0000-4000-8000-000000000001'
const VM_2 = 'c7b3b4bc-0000-4000-8000-000000000002'
const POOL = 'b7569d99-30f8-178a-7d94-801de3e29b5b'
const DOCKER_ID = 'ab'.repeat(32)

const engines = [
  { id: 'engine-1', $VM: VM_1, $pool: POOL },
  { id: 'engine-2', $VM: VM_2, $pool: POOL },
  { id: 'engine-3', host: '192.0.2.3' },
]

const containers = [
  { id: `engine-1_${DOCKER_ID}`, $engine: 'engine-1', $VM: VM_1, $pool: POOL, name: 'web', state: 'running' },
  { id: `engine-1_${'cd'.repeat(32)}`, $engine: 'engine-1', $VM: VM_1, $pool: POOL, name: 'db', state: 'exited' },
]

function setup({ licensed = true, maxListedEngines }: { licensed?: boolean; maxListedEngines?: number } = {}) {
  const calls: { method: string; args: unknown[] }[] = []
  const tasks: Record<string, unknown>[] = []
  const xoApp = {
    config: { getOptional: (path: string) => (path === 'docker.maxListedEngines' ? maxListedEngines : undefined) },
    checkFeatureAuthorization: async () => {
      if (!licensed) {
        throw featureUnauthorized({ featureCode: 'DOCKER' })
      }
    },
    getAllDockerEngines: async () => engines,
    getDockerEngine: async (id: string) => {
      const engine = engines.find(_ => _.id === id)
      if (engine === undefined) {
        throw noSuchObject(id, 'docker-engine')
      }
      return engine
    },
    getDockerContainers: async (opts: unknown) => {
      calls.push({ method: 'getDockerContainers', args: [opts] })
      return {
        containers,
        errors: [{ $engine: 'engine-2', $VM: VM_2, code: 'SSH_AUTH_FAILED', message: 'SSH authentication failed' }],
        asOf: 42,
      }
    },
    runDockerContainerAction: async (...args: unknown[]) => {
      calls.push({ method: 'runDockerContainerAction', args })
    },
    deleteDockerContainer: async (...args: unknown[]) => {
      calls.push({ method: 'deleteDockerContainer', args })
    },
  }
  const restApi = {
    xoApp,
    getCurrentUser: () => ({ id: 'admin', permission: 'admin' }),
    tasks: {
      create: (properties: Record<string, unknown>) => {
        tasks.push(properties)
        return { id: 'task-1', set() {}, run: async (fn: () => unknown) => fn() }
      },
    },
  } as unknown as RestApi
  const service = new DockerContainerService(restApi)
  const controller = new DockerContainerController(restApi, service, new DockerEngineService(restApi))
  return { calls, controller, service, tasks }
}

const scopeOf = (filter: string) => {
  const scope = getEngineScope(safeParseComplexMatcher(filter))
  return scope && engines.filter(scope as never).map(_ => _.id)
}

describe('getEngineScope()', () => {
  it('equality terms on $engine, $VM and $pool', () => {
    assert.deepEqual(scopeOf('$engine:engine-3'), ['engine-3'])
    assert.deepEqual(scopeOf(`$VM:${VM_2}`), ['engine-2'])
    assert.deepEqual(scopeOf(`$VM:"${VM_2.toUpperCase()}"`), ['engine-2'])
    assert.deepEqual(scopeOf(`$pool:${POOL}`), ['engine-1', 'engine-2'])
    // not a substring match, unlike the filter itself
    assert.deepEqual(scopeOf('$engine:engine'), [])
  })

  it('conjunctions, disjunctions', () => {
    assert.deepEqual(scopeOf(`$pool:${POOL} name:web`), ['engine-1', 'engine-2'])
    assert.deepEqual(scopeOf(`$pool:${POOL} $VM:${VM_1}`), ['engine-1'])
    assert.deepEqual(scopeOf('$engine:|(engine-1 engine-3)'), ['engine-1', 'engine-3'])
    assert.deepEqual(scopeOf(`|($engine:engine-3 $VM:${VM_1})`), ['engine-1', 'engine-3'])
    // uninterpretable terms are ignored in a conjunction
    assert.deepEqual(scopeOf('$engine:engine-3 !$VM:foo'), ['engine-3'])
  })

  it('unscoped', () => {
    for (const filter of [
      'name:web',
      '$engine:engine-*',
      '$VM:/^c7b3/',
      '!$engine:engine-1',
      '|($engine:engine-1 name:web)',
      '$engine:|(engine-1 /x/)',
      'engine-1',
    ]) {
      assert.equal(scopeOf(filter), undefined, filter)
    }
  })
})

describe('DockerContainerController', () => {
  describe('scoped listing', () => {
    it('422 without a filter designating engines, before any connection', async () => {
      const { calls, controller } = setup()
      const req = { query: {}, path: '/rest/v0/docker-containers' } as never
      for (const filter of [undefined, 'name:web', '$engine:engine-*']) {
        await assert.rejects(controller.getDockerContainers(req, filter), invalidParameters.is)
      }
      assert.deepEqual(calls, [])
    })

    it('422 above maxListedEngines', async () => {
      const { calls, controller } = setup({ maxListedEngines: 1 })
      const req = { query: {}, path: '/rest/v0/docker-containers' } as never
      await assert.rejects(controller.getDockerContainers(req, `$pool:${POOL}`), invalidParameters.is)
      assert.deepEqual(calls, [])
    })

    it('lists the designated engines, applies the whole filter, reports the failed engines', async () => {
      const { calls, controller } = setup()
      const filter = `$pool:${POOL} state:running`
      const req = { query: { fields: 'name,state', filter }, path: '/rest/v0/docker-containers' } as never
      assert.deepEqual(await controller.getDockerContainers(req, filter), {
        containers: [{ name: 'web', state: 'running', href: `/rest/v0/docker-containers/engine-1_${DOCKER_ID}` }],
        errors: [{ $engine: 'engine-2', $VM: VM_2, code: 'SSH_AUTH_FAILED', message: 'SSH authentication failed' }],
        asOf: 42,
      })
      assert.deepEqual(calls, [
        { method: 'getDockerContainers', args: [{ engines: ['engine-1', 'engine-2'], all: true, stats: false }] },
      ])
    })

    it('a scope designating no engines is valid', async () => {
      const { calls, controller } = setup()
      const req = { query: {}, path: '/rest/v0/docker-containers' } as never
      await controller.getDockerContainers(req, '$VM:c7b3b4bc-0000-4000-8000-00000000dead')
      assert.deepEqual(calls, [{ method: 'getDockerContainers', args: [{ engines: [], all: true, stats: false }] }])
    })

    it('ndjson: the containers only', async () => {
      const { controller } = setup()
      const filter = `$VM:${VM_1}`
      const headers: Record<string, string> = {}
      const req = {
        query: { ndjson: 'true', fields: 'name' },
        path: '/rest/v0/docker-containers',
        res: { setHeader: (name: string, value: string) => (headers[name] = value) },
      } as never
      const stream = (await controller.getDockerContainers(req, filter, 'name', true)) as AsyncIterable<unknown>
      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(String(chunk))
      }
      assert.equal(headers['Content-Type'], 'application/x-ndjson')
      assert.deepEqual(
        chunks
          .join('')
          .split('\n')
          .filter(Boolean)
          .map(line => JSON.parse(line).name),
        ['web', 'db']
      )
    })
  })

  describe('actions and removal', () => {
    it('404 before creating a task, without connecting', async () => {
      const { calls, controller, tasks } = setup()
      for (const id of ['nope', `engine-1_${'z'.repeat(64)}`, `engine-9_${DOCKER_ID}`, `engine-1${DOCKER_ID}`]) {
        await assert.rejects(controller.startDockerContainer(id, true), noSuchObject.is, id)
        await assert.rejects(controller.deleteDockerContainer(id), noSuchObject.is, id)
      }
      assert.deepEqual(calls, [])
      assert.deepEqual(tasks, [])
    })

    it('five explicit actions', async () => {
      const { calls, controller, tasks } = setup()
      const id = `engine-1_${DOCKER_ID}`
      await controller.startDockerContainer(id, true)
      await controller.stopDockerContainer(id, true)
      await controller.restartDockerContainer(id, true)
      await controller.pauseDockerContainer(id, true)
      await controller.unpauseDockerContainer(id, true)
      assert.deepEqual(
        calls.map(_ => _.args),
        ['start', 'stop', 'restart', 'pause', 'unpause'].map(action => [id, action])
      )
      assert.deepEqual(
        tasks.map(_ => [_.name, _.objectId, _.objectType]),
        ['start', 'stop', 'restart', 'pause', 'unpause'].map(action => [
          `REST API: ${action} Docker container`,
          id,
          'docker-container',
        ])
      )
    })

    it('delete, with force and removeVolumes', async () => {
      const { calls, controller } = setup()
      const id = `engine-1_${DOCKER_ID}`
      await controller.deleteDockerContainer(id, true, false)
      assert.deepEqual(calls, [{ method: 'deleteDockerContainer', args: [id, { force: true, removeVolumes: false }] }])
    })

    it('Docker errors are mapped', async () => {
      const { controller } = setup()
      const error = Object.assign(new Error('Container is already paused'), {
        name: 'DockerError',
        code: 'DOCKER_API_ERROR',
        data: { statusCode: 409 },
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(controller as any).restApi.xoApp.runDockerContainerAction = async () => {
        throw error
      }
      await assert.rejects(controller.pauseDockerContainer(`engine-1_${DOCKER_ID}`, true), e => {
        assert.ok(e instanceof ApiError)
        assert.equal(e.status, 409)
        return true
      })
    })
  })

  it('every route checks the DOCKER feature first', async () => {
    const { calls, controller, tasks } = setup({ licensed: false })
    const id = `engine-1_${DOCKER_ID}`
    const req = { query: {}, path: '/rest/v0/docker-containers' } as never
    for (const call of [
      () => controller.getDockerContainers(req, `$VM:${VM_1}`),
      () => controller.getDockerContainer(id),
      () => controller.getDockerContainerLogs(id),
      () => controller.startDockerContainer(id),
      () => controller.stopDockerContainer(id),
      () => controller.restartDockerContainer(id),
      () => controller.pauseDockerContainer(id),
      () => controller.unpauseDockerContainer(id),
      () => controller.deleteDockerContainer(id),
    ]) {
      await assert.rejects(call(), featureUnauthorized.is)
    }
    assert.deepEqual(calls, [])
    assert.deepEqual(tasks, [])
  })
})
