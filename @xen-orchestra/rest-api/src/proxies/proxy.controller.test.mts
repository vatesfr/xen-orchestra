import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { ApiError } from '../helpers/error.helper.mjs'
import { ProxyController } from './proxy.controller.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'

function createController(checkProxyHealth: (id: string) => Promise<void>) {
  const calls: unknown[] = []
  const restApi = {
    xoApp: {
      checkProxyHealth: async (id: string) => {
        calls.push(['checkProxyHealth', id])
        return checkProxyHealth(id)
      },
    },
  } as unknown as RestApi
  const controller = new ProxyController(restApi)
  return { calls, controller }
}

const proxyId = 'e625ea0c-a876-405a-b838-109d762efe88'

describe('ProxyController.getProxyHealth', () => {
  it('forwards the id and returns success when the proxy is reachable', async () => {
    const { calls, controller } = createController(async () => {})

    assert.deepEqual(await controller.getProxyHealth(proxyId), { success: true })
    assert.deepEqual(calls, [['checkProxyHealth', proxyId]])
  })

  it('throws a 502 ApiError when the proxy is unreachable', async () => {
    const { controller } = createController(async () => {
      throw Object.assign(new TypeError('fetch failed'), { code: 'PROXY_UNREACHABLE' })
    })

    await assert.rejects(
      controller.getProxyHealth(proxyId),
      error => error instanceof ApiError && error.status === 502 && error.message === 'Proxy unreachable'
    )
  })

  it('rethrows unrelated errors unchanged', async () => {
    const unrelatedError = new Error('500 Internal Server Error')
    const { controller } = createController(async () => {
      throw unrelatedError
    })

    await assert.rejects(controller.getProxyHealth(proxyId), error => error === unrelatedError)
  })
})

describe('ProxyController.deleteProxy', () => {
  it('forwards the id to destroyProxy', async () => {
    const calls: unknown[] = []
    const restApi = {
      xoApp: {
        destroyProxy: async (id: string) => {
          calls.push(['destroyProxy', id])
        },
      },
    } as unknown as RestApi
    const controller = new ProxyController(restApi)

    await controller.deleteProxy(proxyId)

    assert.deepEqual(calls, [['destroyProxy', proxyId]])
  })
})
