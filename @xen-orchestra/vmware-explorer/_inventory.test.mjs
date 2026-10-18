import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { flattenSnapshots, parseDevices, parseGuestNics, parseVlan } from './_inventory.mjs'

// shaped as the SOAP library returns them: the nested references and types are not normalized
const typed = (type, value) => ({ attributes: { 'xsi:type': type }, ...value })
const ref = (type, value) => ({ attributes: { type }, $value: value })

const DEVICES = {
  VirtualDevice: [
    typed('VirtualLsiLogicController', { key: '1000', busNumber: '0', deviceInfo: { label: 'SCSI controller 0' } }),
    typed('VirtualAHCIController', { key: '15000', busNumber: '1' }),
    typed('VirtualDisk', {
      key: '2000',
      controllerKey: '1000',
      unitNumber: '1',
      capacityInBytes: '10737418240',
      deviceInfo: { label: 'Hard disk 1' },
      backing: typed('VirtualDiskFlatVer2BackingInfo', {
        fileName: '[ds1] vm/vm.vmdk',
        datastore: ref('Datastore', 'datastore-11'),
        diskMode: 'persistent',
        thinProvisioned: 'true',
      }),
    }),
    typed('VirtualDisk', {
      key: '16000',
      controllerKey: '15000',
      unitNumber: '0',
      capacityInKB: '1024',
      backing: typed('VirtualDiskRawDiskMappingVer1BackingInfo', { fileName: '[ds1] vm/rdm.vmdk', keyId: {} }),
    }),
    typed('VirtualVmxnet3', {
      key: '4000',
      macAddress: '00:50:56:aa:bb:cc',
      addressType: 'assigned',
      slotInfo: typed('VirtualDevicePciBusSlotInfo', { pciSlotNumber: '192' }),
      backing: typed('VirtualEthernetCardNetworkBackingInfo', { network: ref('Network', 'network-13') }),
    }),
    typed('VirtualE1000e', {
      key: '4001',
      macAddress: '00:50:56:aa:bb:cd',
      addressType: 'generated',
      backing: typed('VirtualEthernetCardDistributedVirtualPortBackingInfo', { port: { portgroupKey: 'dvpg-key' } }),
    }),
    typed('VirtualCdrom', { key: '3000', controllerKey: '200', unitNumber: '0' }),
  ],
}

describe('parseDevices', function () {
  it('names the disks as the vmx does, whatever their controller', function () {
    const { disks } = parseDevices(DEVICES)
    assert.deepEqual(
      disks.map(({ key }) => key),
      ['scsi0:1', 'sata1:0']
    )
  })

  it('reports the properties of a disk', function () {
    const [disk, rdm] = parseDevices(DEVICES).disks
    assert.deepEqual(disk, {
      key: 'scsi0:1',
      label: 'Hard disk 1',
      capacity: 10737418240,
      fileName: '[ds1] vm/vm.vmdk',
      datastore: 'datastore-11',
      diskMode: 'persistent',
      backingType: 'VirtualDiskFlatVer2BackingInfo',
      thinProvisioned: true,
      rdm: false,
      encrypted: false,
    })
    assert.equal(rdm.capacity, 1024 * 1024)
    assert.equal(rdm.rdm, true)
    assert.equal(rdm.encrypted, true)
  })

  it('resolves the network of a card, distributed or not', function () {
    const { nics } = parseDevices(DEVICES, { 'dvpg-key': 'dvportgroup-5' })
    assert.deepEqual(
      nics.map(({ key, network, macAddress }) => ({ key, network, macAddress })),
      [
        { key: '4000', network: 'network-13', macAddress: '00:50:56:aa:bb:cc' },
        { key: '4001', network: 'dvportgroup-5', macAddress: '00:50:56:aa:bb:cd' },
      ]
    )
  })

  it('reports the PCI slot of a card, when the host assigned one', function () {
    const { nics } = parseDevices(DEVICES)
    assert.deepEqual(
      nics.map(({ pciSlotNumber }) => pciSlotNumber),
      [192, undefined]
    )
  })

  it('does not fail on a VM without devices', function () {
    assert.deepEqual(parseDevices(undefined), { disks: [], nics: [] })
  })

  it('keeps a disk on an unknown controller, under its device key', function () {
    const { disks } = parseDevices({
      VirtualDevice: typed('VirtualDisk', { key: '2001', controllerKey: '999', unitNumber: '0', capacityInKB: '1' }),
    })
    assert.equal(disks[0].key, 'device-2001')
  })
})

describe('parseGuestNics', function () {
  it('reports the addresses of each card, by device key', function () {
    const nics = parseGuestNics({
      GuestNicInfo: [
        typed('GuestNicInfo', {
          macAddress: '00:50:56:aa:bb:cc',
          deviceConfigId: '4000',
          ipAddress: ['10.0.0.5'],
          ipConfig: {
            ipAddress: [
              { ipAddress: '10.0.0.5', prefixLength: '24' },
              { ipAddress: 'fe80::1', prefixLength: '64' },
            ],
          },
        }),
        // older tools only fill the deprecated list
        typed('GuestNicInfo', { macAddress: '00:50:56:aa:bb:cd', deviceConfigId: '4001', ipAddress: '10.0.1.5' }),
        // a card of the guest only
        typed('GuestNicInfo', { macAddress: '02:00:00:00:00:01', deviceConfigId: '-1' }),
      ],
    })
    assert.deepEqual(nics, [
      { key: '4000', macAddress: '00:50:56:aa:bb:cc', addresses: ['10.0.0.5', 'fe80::1'] },
      { key: '4001', macAddress: '00:50:56:aa:bb:cd', addresses: ['10.0.1.5'] },
      { key: undefined, macAddress: '02:00:00:00:00:01', addresses: [] },
    ])
  })

  it('does not fail without tools', function () {
    assert.deepEqual(parseGuestNics(undefined), [])
  })
})

describe('flattenSnapshots', function () {
  it('walks the tree down, keeping the parent of each snapshot', function () {
    const snapshots = flattenSnapshots({
      snapshot: ref('VirtualMachineSnapshot', 'snapshot-1'),
      name: 'root',
      childSnapshotList: [
        { snapshot: ref('VirtualMachineSnapshot', 'snapshot-2'), name: 'a' },
        { snapshot: ref('VirtualMachineSnapshot', 'snapshot-3'), name: 'b' },
      ],
    })
    assert.deepEqual(
      snapshots.map(({ id, name, parent }) => ({ id, name, parent })),
      [
        { id: 'snapshot-1', name: 'root', parent: undefined },
        { id: 'snapshot-2', name: 'a', parent: 'snapshot-1' },
        { id: 'snapshot-3', name: 'b', parent: 'snapshot-1' },
      ]
    )
  })

  it('returns an empty list without snapshot', function () {
    assert.deepEqual(flattenSnapshots(undefined), [])
  })
})

describe('parseVlan', function () {
  it('reads a single VLAN id', function () {
    assert.equal(parseVlan({ vlan: { vlanId: '42' } }), 42)
    assert.equal(parseVlan({ vlan: { vlanId: { $value: '0', attributes: {} } } }), 0)
  })

  it('reads the ranges of a trunk', function () {
    assert.deepEqual(parseVlan({ vlan: { vlanId: { start: '1', end: '4094' } } }), [{ start: 1, end: 4094 }])
  })

  it('returns undefined without VLAN', function () {
    assert.equal(parseVlan(undefined), undefined)
  })
})
