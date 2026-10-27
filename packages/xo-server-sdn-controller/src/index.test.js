import { describe, it, mock } from 'node:test'
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
describe('SDN controller reliability', () => {
  it('handles a stale preferred-center host gracefully', async () => {
    const controller = createFakeController()

    const hostUuid = 'stale-host-uuid'
    const networkUuid = 'network-uuid-1'
    const poolUuid = 'pool-uuid-1'
    const xapi = createFakeXapi()

    const staleHost = {
      $ref: `host-ref-${hostUuid}`,
      $id: `host-id-${hostUuid}`,
      uuid: hostUuid,
      name_label: 'stale-host',
      PIFs: [],
      enabled: true,
      $pool: { uuid: poolUuid, $ref: `pool-ref-${poolUuid}`, $id: `${poolUuid}-id` },
    }

    const testNetwork = {
      $ref: 'network-ref-1',
      $id: 'network-id-1',
      $pool: { uuid: poolUuid, $ref: `pool-ref-${poolUuid}`, $id: `${poolUuid}-id`, $xapi: xapi },
      name_label: 'test-network',
      other_config: {
        'xo:sdn-controller:private-network-uuid': networkUuid,
        'xo:sdn-controller:preferred-center': hostUuid,
      },
      $xapi: xapi,
      update_other_config: mock.fn(() => Promise.resolve(testNetwork)),
    }

    const xapiObjects = {
      indexes: {
        type: {
          SDN_controller: [{ protocol: 'pssl', address: '', port: 0 }],
          network: [testNetwork],
          host: [staleHost],
        },
      },
    }

    xapi.barrier = async (ref, obj) => obj ?? testNetwork

    xapi.objects = new EventEmitter()
    xapi.objects.indexes = xapiObjects.indexes

    const getObject = mock.fn(() => {
      const error = new Error(`Object not found: ${hostUuid}`)
      error.code = 'object_not_found'
      throw error
    })
    controller._xo = {
      ...controller._xo,
      getObject,
      getXapiObject: () => undefined,
    }

    controller._getOrCreateOvsdbClient = mock.fn(() => undefined)
    controller._getOrCreateOfChannel = mock.fn(() => undefined)

    await assert.doesNotReject(async () => {
      await controller._handleConnectedXapi(xapi)
    }, /Object not found/)

    assert.equal(getObject.mock.calls.length, 1)
    assert.equal(getObject.mock.calls[0].arguments[0], hostUuid)
    assert.equal(getObject.mock.calls[0].arguments[1], 'host')
  })

  it('handles PIF unplugged when center is undefined', async () => {
    const controller = createFakeController()

    const poolUuid = 'pool-uuid-1'
    const hostId = 'host-1'
    const networkId = 'network-1'
    const xapi = createFakeXapi()
    const xapiObjects = {
      indexes: {
        type: {
          network: [
            {
              $ref: 'network-ref-1',
              $id: networkId,
              $pool: { uuid: poolUuid, $ref: `pool-ref-${poolUuid}`, $id: `${poolUuid}-id` },
              name_label: 'test-network',
              other_config: {
                'xo:sdn-controller:private-network-uuid': 'private-network-uuid',
                'xo:sdn-controller:vni': '100',
              },
            },
          ],
          host: [
            {
              $ref: `host-ref-${hostId}`,
              $id: hostId,
              name_label: 'host-1',
              PIFs: ['pif-ref-1'],
              enabled: true,
              $pool: { uuid: poolUuid, $ref: `pool-ref-${poolUuid}`, $id: `${poolUuid}-id` },
            },
          ],
        },
      },
    }

    xapi.objects = new EventEmitter()
    xapi.objects.indexes = xapiObjects.indexes
    xapi.objectsFetched = Promise.resolve()

    const getObject = mock.fn((id, type) => ({
      $ref: 'network-ref-1',
      $id: networkId,
      $pool: { uuid: poolUuid, $ref: `pool-ref-${poolUuid}`, $id: `${poolUuid}-id` },
      name_label: 'test-network',
      other_config: {
        'xo:sdn-controller:private-network-uuid': 'private-network-uuid',
        'xo:sdn-controller:vni': '100',
      },
    }))

    const getXapiObject = mock.fn(obj => {
      if (obj === undefined) return undefined
      return {
        $ref: obj.$ref,
        $id: obj.$id,
      }
    })

    controller._xo = {
      ...controller._xo,
      getObject,
      getXapiObject,
    }

    await controller._manageXapi(xapi)

    controller.privateNetworks['private-network-uuid'] = {
      uuid: 'private-network-uuid',
      networks: {
        [poolUuid]: {
          $ref: 'network-ref-1',
          $id: networkId,
          $pool: { uuid: poolUuid },
        },
      },
      center: undefined,
    }

    const pif = {
      $ref: 'pif-ref-1',
      $id: 'pif-id-1',
      $pool: { uuid: poolUuid, $ref: `pool-ref-${poolUuid}`, $id: `${poolUuid}-id` },
      $host: { $ref: `host-ref-${hostId}`, $id: hostId, $pool: { uuid: poolUuid } },
      $network: { $ref: 'network-ref-1', $id: networkId, name_label: 'test-network' },
      currently_attached: false,
      device: 'eth0',
    }

    await assert.doesNotReject(async () => {
      await controller._pifUpdated(pif)
    })
  })

  it('cleans up partial state when addNetwork fails', async () => {
    const controller = createFakeController()

    const networkUuid = 'network-uuid-1'
    const poolUuid = 'pool-uuid-1'
    const networkId = 'network-1'
    const xapi = createFakeXapi()

    const createHost = hostId => ({
      $ref: `host-ref-${hostId}`,
      $id: hostId,
      uuid: hostId,
      name_label: hostId,
      enabled: true,
      $metrics: { live: true },
      $pool: { uuid: poolUuid, $ref: `pool-ref-${poolUuid}`, $id: `${poolUuid}-id` },
      // host-1 has no PIF on the private network: addHost fails on it,
      // while host-2 is eligible and gets elected center
      $PIFs: hostId === 'host-2' ? [{ network: `network-ref-${networkId}`, currently_attached: true }] : [],
    })
    const host1 = createHost('host-1')
    const host2 = createHost('host-2')

    const testNetwork = {
      $ref: `network-ref-${networkId}`,
      $id: networkId,
      name_label: 'test-network',
      other_config: {
        'xo:sdn-controller:private-network-uuid': networkUuid,
        'xo:sdn-controller:vni': '100',
      },
      $PIFs: [{ $tunnel_access_PIF_of: [{ $transport_PIF: { ip_configuration_mode: 'static' } }] }],
      $pool: { uuid: poolUuid, $ref: `pool-ref-${poolUuid}`, $id: `${poolUuid}-id`, $xapi: xapi },
      $xapi: xapi,
    }

    xapi.objects.indexes = {
      type: {
        SDN_controller: [{ protocol: 'pssl', address: '', port: 0 }],
        network: [testNetwork],
        host: [host1, host2],
      },
    }
    xapi.barrier = async ref => (ref === testNetwork.$ref ? testNetwork : undefined)
    xapi.getRecord = async () => testNetwork

    // OVSDB clients that reset fine; the addNetwork failure comes from the
    // missing PIF of host-1, leaving the elected center (host-2) set without
    // being registered in _starCenters
    const ovsdbClient = { resetForNetwork: async () => undefined }
    controller.ovsdbClients = { [host1.$ref]: ovsdbClient, [host2.$ref]: ovsdbClient }

    controller._getOrCreateOvsdbClient = mock.fn(() => undefined)
    controller._getOrCreateOfChannel = mock.fn(() => undefined)

    await assert.doesNotReject(async () => {
      await controller._handleConnectedXapi(xapi)
    })

    assert.equal(controller.privateNetworks[networkUuid], undefined)
    assert.equal(controller._networks.size, 0)
    assert.equal(controller._starCenters.size, 0)
  })
})
