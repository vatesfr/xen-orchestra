import { describe, it } from 'node:test'
import { EventEmitter } from 'events'
import { strict as assert } from 'node:assert'

import createSdnController from './index.js'

const noop = () => undefined

// Mimics the xo-server behavior: on reconnection a new Xapi instance is
// created (same pool UUID, same XAPI object $refs)
function createFakeXapi() {
  return {
    objectsFetched: Promise.resolve(),
    pool: { uuid: 'pool-uuid-1' },
    objects: new EventEmitter(),
    call: async () => ['sdn-controller-ca.pem'],
  }
}

function createFakeController() {
  const controller = createSdnController({
    xo: {
      addApiMethods: noop,
      registerRestRoutes: noop,
      getAllXapis: () => [],
      on: noop,
      removeListener: noop,
    },
    getDataDir: async () => '/tmp',
    staticConfig: {},
  })
  controller._installCaCertificateIfNeeded = async () => undefined
  return controller
}

describe('xapi event listeners', () => {
  it('are attached to a new Xapi instance on reconnection', async () => {
    const controller = createFakeController()

    const xapi1 = createFakeXapi()
    await controller._manageXapi(xapi1)
    assert.equal(xapi1.objects.listenerCount('update'), 1)

    // the cleaner detaches the listeners
    controller._handleDisconnectedXapi(xapi1)
    assert.equal(xapi1.objects.listenerCount('update'), 0)

    // a new Xapi instance (same pool UUID, same $refs) is created on
    // reconnection: its objects emitter must be watched again
    const xapi2 = createFakeXapi()
    await controller._manageXapi(xapi2)
    assert.equal(xapi2.objects.listenerCount('update'), 1)
  })

  it('do not leak on repeated connect/disconnect cycles', async () => {
    const controller = createFakeController()
    const xapis = []

    for (let i = 0; i < 3; i++) {
      const xapi = createFakeXapi()
      xapis.push(xapi)
      await controller._manageXapi(xapi)
      controller._handleDisconnectedXapi(xapi)
    }

    for (const xapi of xapis) {
      assert.equal(xapi.objects.listenerCount('update'), 0)
    }
    assert.equal(controller._managedXapis.size, 0)
    assert.equal(controller._xapiCleaners.size, 0)
  })
})
