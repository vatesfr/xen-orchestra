import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { forbiddenOperation } from 'xo-common/api-errors.js'

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

const vmUuid = '3d0c7bd6-8b7e-4b2a-9c1f-6f0e5d4c3b2a'

function createUpdateController({ permission = 'admin' }: { permission?: string } = {}) {
  const calls: unknown[] = []
  const restApi = {
    getCurrentUser: () => ({ id: 'user-id', permission }),
    getObject: (...args: unknown[]) => {
      calls.push(['getObject', ...args])
    },
    xoApp: {
      updateProxy: async (...args: unknown[]) => {
        calls.push(['updateProxy', ...args])
      },
    },
  } as unknown as RestApi
  const controller = new ProxyController(restApi)
  return { calls, controller }
}

describe('ProxyController.updateProxy', () => {
  it('forwards the body to updateProxy after checking the VM exists', async () => {
    const { calls, controller } = createUpdateController()
    const body = { address: '192.168.1.10:443', name: 'My proxy', vmUuid }

    await controller.updateProxy(proxyId, body)

    assert.deepEqual(calls, [
      ['getObject', vmUuid, 'VM'],
      ['updateProxy', proxyId, body],
    ])
  })

  it('forwards null to remove address or vmUuid', async () => {
    const { calls, controller } = createUpdateController()

    await controller.updateProxy(proxyId, { address: null, vmUuid: null })

    assert.deepEqual(calls, [['updateProxy', proxyId, { address: null, vmUuid: null }]])
  })

  it('lets a non-admin change the name', async () => {
    const { calls, controller } = createUpdateController({ permission: 'none' })

    await controller.updateProxy(proxyId, { name: 'My proxy' })

    assert.deepEqual(calls, [['updateProxy', proxyId, { name: 'My proxy', vmUuid: undefined }]])
  })

  for (const body of [{ address: 'attacker:443' }, { address: null }, { vmUuid }, { vmUuid: null }]) {
    it(`refuses ${JSON.stringify(body)} to a non-admin`, async () => {
      const { calls, controller } = createUpdateController({ permission: 'none' })

      await assert.rejects(controller.updateProxy(proxyId, { name: 'My proxy', ...body }), error =>
        forbiddenOperation.is(error)
      )
      assert.deepEqual(calls, [])
    })
  }
})
