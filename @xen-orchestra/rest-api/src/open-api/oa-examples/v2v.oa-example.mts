export const v2vStatus = {
  vectura: { status: 'success' },
}

export const v2vInventory = {
  product: 'VMware vCenter Server',
  version: '8.0.2',
  instanceUuid: '5a7c1b0e-3f6d-4f2a-9b1e-2d8c4e6f7a90',
  datacenters: [{ id: 'datacenter-3', name: 'DC-Paris' }],
  clusters: [{ id: 'domain-c8', name: 'Cluster-Prod', datacenterId: 'datacenter-3' }],
  hosts: [{ id: 'host-12', name: 'esx01.example.org', clusterId: 'domain-c8', datacenterId: 'datacenter-3' }],
  datastores: [
    {
      id: 'datastore-15',
      name: 'ds-prod-01',
      type: 'VMFS',
      capacity: 2199023255552,
      free: 879609302220,
      hostIds: ['host-12'],
    },
  ],
  portGroups: [
    { id: 'network-16', name: 'VM Network' },
    { id: 'dvportgroup-21', name: 'prod-vlan12', vlan: 12 },
  ],
  vms: [
    {
      id: 'vm-1042',
      instanceUuid: '502c7a3b-9d1e-4e5f-8a6b-7c8d9e0f1a2b',
      name: 'web-01',
      description: '',
      powerState: 'poweredOn',
      hostId: 'host-12',
      nCpus: 2,
      memory: 4294967296,
      firmware: 'uefi',
      secureBoot: false,
      datastoreIds: ['datastore-15'],
      snapshotCount: 1,
      currentSnapshotId: 'snapshot-1101',
      disks: [
        {
          key: 'scsi0:0',
          label: 'Hard disk 1',
          datastoreId: 'datastore-15',
          capacity: 42949672960,
          mode: 'persistent',
          isRdm: false,
          isEncrypted: false,
        },
      ],
      nics: [
        { key: '4000', label: 'Network adapter 1', portGroupId: 'dvportgroup-21', macAddress: '00:50:56:9a:3c:11' },
      ],
    },
  ],
}

export const v2vStartResult = {
  'vm-1042': '9d0d04f7-bb1f-8292-3294-17c6371827c5',
}
