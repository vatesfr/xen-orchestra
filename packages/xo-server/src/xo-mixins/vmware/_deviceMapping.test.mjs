import { strict as assert } from 'node:assert'
import test from 'node:test'

import { assertKnownDevices, resolveDestinations } from './_deviceMapping.mjs'

const metadata = { disks: [{ node: 'scsi0:0' }, { node: 'sata0:1' }], networks: [{ key: '4000' }] }

test('assertKnownDevices', async t => {
  await t.test('accepts mappings of existing devices, and no mapping at all', () => {
    assertKnownDevices(metadata, { srIdsByNode: { 'sata0:1': 'sr' }, networkIdsByNic: { 4000: 'net' }, vmId: 'vm-1' })
    assertKnownDevices(metadata, { srIdsByNode: {}, networkIdsByNic: {}, vmId: 'vm-1' })
  })

  await t.test('names every unknown device', () => {
    assert.throws(
      () =>
        assertKnownDevices(metadata, {
          srIdsByNode: { 'scsi0:0': 'sr', 'nvme0:0': 'sr' },
          networkIdsByNic: { 4001: 'net' },
          vmId: 'vm-1',
        }),
      {
        code: 'UNKNOWN_DEVICE',
        message: 'the VM vm-1 has no disk nvme0:0, NIC 4001',
        unknownNodes: ['nvme0:0'],
        unknownNics: ['4001'],
      }
    )
  })
})

test('resolveDestinations', async t => {
  const pool = { uuid: 'pool-1' }
  const otherPool = { uuid: 'pool-2' }
  const objects = {
    sr: { $pool: pool },
    'sr-2': { $pool: pool },
    'sr-other': { $pool: otherPool },
    net: { $pool: pool },
    'net-2': { $pool: pool },
    'net-other': { $pool: otherPool },
  }
  const app = { getXapiObject: id => objects[id] }
  const mapping = { sr: objects.sr, srId: 'sr', networkId: 'net', srIdsByNode: {}, networkIdsByNic: {}, vmId: 'vm-1' }

  await t.test('resolves the default network and the overrides', () => {
    const { srsByNode, network, networksByNic } = resolveDestinations(app, {
      ...mapping,
      srIdsByNode: { 'scsi0:0': 'sr-2' },
      networkIdsByNic: { 4000: 'net-2' },
    })
    assert.equal(network, objects.net)
    assert.deepEqual(srsByNode, { 'scsi0:0': objects['sr-2'] })
    assert.deepEqual(networksByNic, { 4000: objects['net-2'] })
  })

  await t.test('refuses an SR of another pool', () => {
    assert.throws(() => resolveDestinations(app, { ...mapping, srIdsByNode: { 'scsi0:0': 'sr-other' } }), {
      code: 'SR_NOT_IN_POOL',
      node: 'scsi0:0',
      srId: 'sr-other',
      poolId: 'pool-1',
    })
  })

  await t.test('refuses a network of another pool, default or by NIC', () => {
    assert.throws(() => resolveDestinations(app, { ...mapping, networkId: 'net-other' }), {
      code: 'NETWORK_NOT_IN_POOL',
      message: 'the network net-other is not in the pool of the SR sr',
    })
    assert.throws(() => resolveDestinations(app, { ...mapping, networkIdsByNic: { 4000: 'net-other' } }), {
      code: 'NETWORK_NOT_IN_POOL',
      nic: '4000',
      networkId: 'net-other',
    })
  })
})
