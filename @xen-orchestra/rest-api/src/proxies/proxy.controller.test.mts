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
  const record =
    (method: string) =>
    async (...args: unknown[]) => {
      calls.push([method, ...args])
      return result()
    }
  const restApi = {
    xoApp: {
      checkProxyHealth: record('checkProxyHealth'),
      getProxyApplianceUpdaterState: record('getProxyApplianceUpdaterState'),
    },
  } as unknown as RestApi
  const controller = new ProxyController(restApi)
  return { calls, controller }
}

for (const [method, xoAppMethod, xoAppResult, expected] of [
  ['getProxyHealth', 'checkProxyHealth', undefined, { success: true }],
  ['getProxyUpdaterState', 'getProxyApplianceUpdaterState', updaterState, updaterState],
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
