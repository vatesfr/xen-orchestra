import { strict as assert } from 'node:assert'
import test from 'node:test'

import { assertKnownDevices } from './_deviceMapping.mjs'

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
