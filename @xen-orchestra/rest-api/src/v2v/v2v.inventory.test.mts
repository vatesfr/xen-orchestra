import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { VmwareInventory, VmwareVm } from '@vates/types'

import { toXoV2vInventory } from './v2v.inventory.mjs'

const sourceVm = (vm: Partial<VmwareVm> = {}): VmwareVm => ({
  id: 'vm-1',
  secureBoot: false,
  isTemplate: false,
  datastores: [],
  networks: [],
  snapshots: [],
  disks: [],
  nics: [],
  ...vm,
})

const sourceInventory = (inventory: Partial<VmwareInventory> = {}): VmwareInventory => ({
  datacenters: [],
  clusters: [],
  hosts: [],
  datastores: [],
  networks: [],
  vms: [],
  ...inventory,
})

describe('toXoV2vInventory', function () {
  it('keeps the identity of the source', function () {
    const inventory = toXoV2vInventory(
      sourceInventory({
        product: 'VMware vCenter Server',
        productType: 'VirtualCenter',
        version: '8.0.2',
        instanceUuid: 'vc-1',
      })
    )

    assert.deepEqual(
      { product: inventory.product, version: inventory.version, instanceUuid: inventory.instanceUuid },
      { product: 'VMware vCenter Server', version: '8.0.2', instanceUuid: 'vc-1' }
    )
  })

  it('points the hosts and the clusters up to their cluster and datacenter', function () {
    const inventory = toXoV2vInventory(
      sourceInventory({
        datacenters: [{ id: 'datacenter-1', name: 'DC', datastores: ['datastore-1'], networks: [] }],
        clusters: [
          { id: 'domain-c7', name: 'Cluster', parent: 'group-h4', datacenter: 'datacenter-1', hosts: ['host-10'] },
        ],
        hosts: [
          { id: 'host-10', name: 'esx1', parent: 'domain-c7', datacenter: 'datacenter-1' },
          // a standalone host: its parent is its own compute resource
          { id: 'host-11', name: 'esx2', parent: 'domain-s9', datacenter: 'datacenter-1' },
        ],
      })
    )

    assert.deepEqual(inventory.datacenters, [{ id: 'datacenter-1', name: 'DC' }])
    assert.deepEqual(inventory.clusters, [{ id: 'domain-c7', name: 'Cluster', datacenterId: 'datacenter-1' }])
    assert.deepEqual(inventory.hosts, [
      { id: 'host-10', name: 'esx1', clusterId: 'domain-c7', datacenterId: 'datacenter-1' },
      { id: 'host-11', name: 'esx2', clusterId: undefined, datacenterId: 'datacenter-1' },
    ])
  })

  it('leaves out the hosts and the clusters outside of any datacenter', function () {
    const inventory = toXoV2vInventory(
      sourceInventory({
        clusters: [{ id: 'domain-c7', name: 'Cluster', hosts: [] }],
        hosts: [{ id: 'host-10', name: 'esx1', parent: 'domain-c7' }],
      })
    )

    assert.deepEqual({ clusters: inventory.clusters, hosts: inventory.hosts }, { clusters: [], hosts: [] })
  })

  it('renames the space of the datastores, and names an inaccessible one after its id', function () {
    const inventory = toXoV2vInventory(
      sourceInventory({
        datastores: [
          {
            id: 'datastore-1',
            name: 'ds1',
            type: 'VMFS',
            url: 'ds:///vmfs/volumes/1/',
            capacity: 1000,
            freeSpace: 400,
            accessible: true,
            hosts: ['host-10'],
          },
          { id: 'datastore-2', accessible: false, hosts: [] },
        ],
      })
    )

    assert.deepEqual(inventory.datastores, [
      { id: 'datastore-1', name: 'ds1', type: 'VMFS', capacity: 1000, free: 400, hostIds: ['host-10'] },
      { id: 'datastore-2', name: 'datastore-2', type: '', capacity: 0, free: 0, hostIds: [] },
    ])
  })

  it('lists the networks as port groups, with a VLAN only when it is a single one', function () {
    const inventory = toXoV2vInventory(
      sourceInventory({
        networks: [
          { id: 'network-1', name: 'VM Network', distributed: false },
          { id: 'dvportgroup-2', name: 'prod', distributed: true, key: 'dvpg-2', vlan: 12 },
          { id: 'dvportgroup-3', name: 'trunk', distributed: true, key: 'dvpg-3', vlan: [{ start: 1, end: 4094 }] },
        ],
      })
    )

    assert.deepEqual(inventory.portGroups, [
      { id: 'network-1', name: 'VM Network', vlan: undefined },
      { id: 'dvportgroup-2', name: 'prod', vlan: 12 },
      { id: 'dvportgroup-3', name: 'trunk', vlan: undefined },
    ])
  })

  it('describes a VM as the wizard shows it', function () {
    const {
      vms: [vm],
    } = toXoV2vInventory(
      sourceInventory({
        vms: [
          sourceVm({
            name: 'web',
            annotation: 'front',
            instanceUuid: 'uuid-1',
            firmware: 'uefi',
            secureBoot: true,
            cpus: 2,
            memory: 4096,
            powerState: 'poweredOn',
            host: 'host-10',
            datastores: ['datastore-1'],
            currentSnapshot: 'snapshot-2',
            snapshots: [
              { id: 'snapshot-1', name: 'a' },
              { id: 'snapshot-2', name: 'b', parent: 'snapshot-1' },
            ],
          }),
        ],
      })
    )

    assert.deepEqual(vm, {
      id: 'vm-1',
      instanceUuid: 'uuid-1',
      name: 'web',
      description: 'front',
      powerState: 'poweredOn',
      hostId: 'host-10',
      nCpus: 2,
      memory: 4096,
      firmware: 'uefi',
      secureBoot: true,
      datastoreIds: ['datastore-1'],
      snapshotCount: 2,
      currentSnapshotId: 'snapshot-2',
      disks: [],
      nics: [],
    })
  })

  it('keeps the keys of the disks and of the network cards, which the start maps are indexed by', function () {
    const {
      vms: [vm],
    } = toXoV2vInventory(
      sourceInventory({
        vms: [
          sourceVm({
            disks: [
              {
                key: 'scsi0:0',
                label: 'Hard disk 1',
                capacity: 1024,
                datastore: 'datastore-1',
                diskMode: 'independent_persistent',
                thinProvisioned: true,
                rdm: true,
                encrypted: true,
              },
            ],
            nics: [
              { key: '4000', label: 'Network adapter 1', macAddress: '00:50:56:aa:bb:cc', network: 'dvportgroup-2' },
              // an NSX opaque network is not a port group
              { key: '4001', label: 'Network adapter 2', opaqueNetworkId: 'nsx-1' },
            ],
          }),
        ],
      })
    )

    assert.deepEqual(vm.disks, [
      {
        key: 'scsi0:0',
        label: 'Hard disk 1',
        datastoreId: 'datastore-1',
        capacity: 1024,
        mode: 'independent_persistent',
        isRdm: true,
        isEncrypted: true,
      },
    ])
    assert.deepEqual(vm.nics, [
      { key: '4000', label: 'Network adapter 1', portGroupId: 'dvportgroup-2', macAddress: '00:50:56:aa:bb:cc' },
      { key: '4001', label: 'Network adapter 2', portGroupId: undefined, macAddress: '' },
    ])
  })

  it('falls back to the defaults of vSphere when the source does not tell', function () {
    const {
      vms: [vm],
    } = toXoV2vInventory(
      sourceInventory({
        vms: [
          sourceVm({
            disks: [
              {
                key: 'scsi0:0',
                label: 'Hard disk 1',
                capacity: 1024,
                thinProvisioned: false,
                rdm: false,
                encrypted: false,
              },
            ],
          }),
        ],
      })
    )

    assert.deepEqual(
      { name: vm.name, powerState: vm.powerState, firmware: vm.firmware, mode: vm.disks[0].mode },
      { name: 'vm-1', powerState: 'poweredOff', firmware: 'bios', mode: 'persistent' }
    )
  })

  it('leaves out the templates, which cannot be migrated', function () {
    const inventory = toXoV2vInventory(
      sourceInventory({ vms: [sourceVm({ id: 'vm-1' }), sourceVm({ id: 'vm-2', isTemplate: true })] })
    )

    assert.deepEqual(
      inventory.vms.map(vm => vm.id),
      ['vm-1']
    )
  })
})
