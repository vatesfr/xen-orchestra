export const v2vInventory = {
  platform: 'vmware',
  product: 'VMware vCenter Server',
  productType: 'VirtualCenter',
  version: '8.0.2',
  build: '22617221',
  instanceUuid: '5a7c1b0e-3f6d-4f2a-9b1e-2d8c4e6f7a90',
  datacenters: [
    { id: 'datacenter-3', name: 'DC-Paris', datastores: ['datastore-15'], networks: ['network-16', 'dvportgroup-21'] },
  ],
  clusters: [{ id: 'domain-c8', name: 'Cluster-Prod', parent: 'group-h5', hosts: ['host-12'] }],
  hosts: [{ id: 'host-12', name: 'esx01.example.org', parent: 'domain-c8' }],
  datastores: [
    {
      id: 'datastore-15',
      name: 'ds-prod-01',
      type: 'VMFS',
      url: 'ds:///vmfs/volumes/64b7e2f1-8f3c5a2e-1d2c-0050569a1b2c/',
      capacity: 2199023255552,
      freeSpace: 879609302220,
      accessible: true,
    },
  ],
  networks: [
    { id: 'network-16', name: 'VM Network', distributed: false },
    { id: 'dvportgroup-21', name: 'prod-vlan12', distributed: true, key: 'dvportgroup-21', vlan: 12 },
  ],
  vms: [
    {
      id: 'vm-1042',
      name: 'web-01',
      annotation: '',
      instanceUuid: '502c7a3b-9d1e-4e5f-8a6b-7c8d9e0f1a2b',
      firmware: 'uefi',
      secureBoot: false,
      guestId: 'debian12_64Guest',
      guestFullName: 'Debian GNU/Linux 12 (64-bit)',
      isTemplate: false,
      cpus: 2,
      memory: 4294967296,
      powerState: 'poweredOn',
      host: 'host-12',
      datastores: ['datastore-15'],
      networks: ['dvportgroup-21'],
      currentSnapshot: 'snapshot-1101',
      snapshots: [
        {
          id: 'snapshot-1101',
          name: 'before upgrade',
          description: '',
          createTime: '2026-09-30T08:12:45.000Z',
        },
      ],
      disks: [
        {
          key: 'scsi0:0',
          label: 'Hard disk 1',
          capacity: 42949672960,
          fileName: '[ds-prod-01] web-01/web-01.vmdk',
          datastore: 'datastore-15',
          diskMode: 'persistent',
          backingType: 'VirtualDiskFlatVer2BackingInfo',
          thinProvisioned: true,
          rdm: false,
          encrypted: false,
        },
      ],
      nics: [
        {
          key: '4000',
          label: 'Network adapter 1',
          macAddress: '00:50:56:9a:3c:11',
          addressType: 'assigned',
          network: 'dvportgroup-21',
          portgroupKey: 'dvportgroup-21',
        },
      ],
    },
  ],
}

export const v2vStartResult = {
  'vm-1042': '9d0d04f7-bb1f-8292-3294-17c6371827c5',
}
