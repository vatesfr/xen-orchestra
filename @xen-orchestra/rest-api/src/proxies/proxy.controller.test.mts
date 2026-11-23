import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { ApiError } from '../helpers/error.helper.mjs'
import { ProxyController } from './proxy.controller.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'

const proxyId = 'e625ea0c-a876-405a-b838-109d762efe88'

const updaterState = { level: 'info', message: 'xoa is up to date', state: 'xoa-up-to-date' }

const unreachableErrors = [
  Object.assign(new TypeError('fetch failed'), { code: 'PROXY_UNREACHABLE' }),
  Object.assign(new Error('cannot get the proxy address'), { code: 'PROXY_UNREACHABLE' }),
]

function createController(result: () => Promise<unknown>) {
  const calls: unknown[] = []
  const tasks: unknown[] = []
  const record =
    (method: string) =>
    async (...args: unknown[]) => {
      calls.push([method, ...args])
      return result()
    }
  const restApi = {
    tasks: {
      create: (properties: unknown) => {
        tasks.push(properties)
        return { id: 'task-1', properties, run: (fn: () => unknown) => fn() }
      },
    },
    xoApp: {
      checkProxyHealth: record('checkProxyHealth'),
      getProxyApplianceUpdaterState: record('getProxyApplianceUpdaterState'),
      upgradeProxyAppliance: record('upgradeProxyAppliance'),
    },
  } as unknown as RestApi
  const controller = new ProxyController(restApi)
  return { calls, controller, tasks }
}

for (const [method, xoAppMethod, xoAppResult, expected] of [
  ['getProxyHealth', 'checkProxyHealth', undefined, { success: true }],
  ['getProxyApplianceUpdaterState', 'getProxyApplianceUpdaterState', updaterState, updaterState],
] as const) {
  describe(`ProxyController.${method}`, () => {
    it(`forwards the id to ${xoAppMethod} and returns the result`, async () => {
      const { calls, controller } = createController(async () => xoAppResult)

      assert.deepEqual(await controller[method](proxyId), expected)
      assert.deepEqual(calls, [[xoAppMethod, proxyId]])
    })

    for (const unreachableError of unreachableErrors) {
      it(`throws a 502 ApiError on "${unreachableError.message}"`, async () => {
        const { controller } = createController(async () => {
          throw unreachableError
        })

        await assert.rejects(
          controller[method](proxyId),
          error => error instanceof ApiError && error.status === 502 && error.message === 'Proxy unreachable'
        )
      })
    }

    it('rethrows unrelated errors unchanged', async () => {
      const unrelatedError = new Error('401 Unauthorized')
      const { controller } = createController(async () => {
        throw unrelatedError
      })

      await assert.rejects(controller[method](proxyId), error => error === unrelatedError)
    })
  })
}

describe('ProxyController.upgradeProxy', () => {
  it('upgrades in a task without force by default', async () => {
    const { calls, controller, tasks } = createController(async () => undefined)

    await controller.upgradeProxy(proxyId, undefined, true)

    assert.deepEqual(calls, [['upgradeProxyAppliance', proxyId, { force: false, ignoreRunningJobs: false }]])
    assert.deepEqual(tasks, [
      {
        name: 'REST API: upgrade proxy appliance',
        objectId: proxyId,
        objectType: 'proxy',
        params: undefined,
        type: 'xo:rest-api:action',
      },
    ])
    assert.equal(controller.getStatus(), 204)
  })

  it('ignores running jobs by default when forced', async () => {
    const { calls, controller } = createController(async () => undefined)

    await controller.upgradeProxy(proxyId, { force: true }, true)

    assert.deepEqual(calls, [['upgradeProxyAppliance', proxyId, { force: true, ignoreRunningJobs: true }]])
  })

  it('forwards an explicit ignoreRunningJobs', async () => {
    const { calls, controller } = createController(async () => undefined)

    await controller.upgradeProxy(proxyId, { force: true, ignoreRunningJobs: false }, true)

    assert.deepEqual(calls, [['upgradeProxyAppliance', proxyId, { force: true, ignoreRunningJobs: false }]])
  })

  it('returns the task id when not synchronous', async () => {
    const { controller } = createController(async () => undefined)

    assert.deepEqual(await controller.upgradeProxy(proxyId), { taskId: 'task-1' })
    assert.equal(controller.getStatus(), 202)
  })

  for (const unreachableError of unreachableErrors) {
    it(`throws a 502 ApiError on "${unreachableError.message}"`, async () => {
      const { controller } = createController(async () => {
        throw unreachableError
      })

      await assert.rejects(
        controller.upgradeProxy(proxyId, undefined, true),
        error => error instanceof ApiError && error.status === 502 && error.message === 'Proxy unreachable'
      )
    })
  }
})
