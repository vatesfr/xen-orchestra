export const srIds = [
  '/rest/v0/srs/e46e7ea5-1bbe-e499-69a5-6bfb395eb146',
  '/rest/v0/srs/3d1227f3-7d40-a104-efc6-fb797b58f258',
]

export const partialSrs = [
  {
    uuid: '4cb0d74e-a7c1-0b7d-46e3-09382c012abb',
    name_label: 'Local storage',
    allocationStrategy: 'thin',
    href: '/rest/v0/srs/4cb0d74e-a7c1-0b7d-46e3-09382c012abb',
  },
  {
    uuid: 'c4284e12-37c9-7967-b9e8-83ef229c3e03',
    name_label: 'Local storage',
    allocationStrategy: 'thin',
    href: '/rest/v0/srs/c4284e12-37c9-7967-b9e8-83ef229c3e03',
  },
  {
    uuid: '8aa2fb4a-143e-c2bc-05d4-c68bbb101d41',
    name_label: 'Local storage',
    allocationStrategy: 'thin',
    href: '/rest/v0/srs/8aa2fb4a-143e-c2bc-05d4-c68bbb101d41',
  },
  {
    uuid: 'c787b75c-3e0d-70fa-d0c3-cbfd382d7e33',
    name_label: 'XOSTOR NVME',
    allocationStrategy: 'thin',
    href: '/rest/v0/srs/c787b75c-3e0d-70fa-d0c3-cbfd382d7e33',
  },
]

export const sr = {
  type: 'SR',
  content_type: 'user',
  physical_usage: 16423866368,
  allocationStrategy: 'thin',
  current_operations: {},
  inMaintenanceMode: false,
  name_description: '',
  name_label: 'Local storage',
  size: 73682485248,
  shared: false,
  SR_type: 'ext',
  tags: [],
  usage: 112759681168,
  VDIs: [
    '7192fab6-e985-42a5-9d23-62deca4b8823',
    'a2caa5f0-b7c9-4ac3-8a65-a9829a39bd98',
    'f8e3da31-4556-4922-b7ce-76429fa88d5e',
    '4b737630-2958-46f0-a997-c9dc8f4457b4',
    '882e52c5-afd5-44b5-a218-e4f7d1aa68b3',
    'd636a574-ebe4-42b8-9456-790e111c60f0',
    '55860d04-cf0a-4cc3-8295-e537ad4a9687',
    'fbda4d74-9017-460a-8a4c-bb5c39795ec4',
    '0e63828c-5a37-429d-b28f-9172424a541a',
    'fc3ff36a-3f08-4999-a3ea-7944e44a2e9b',
    'b4661cb7-6b3f-46e4-b2b7-1acb9d3a28be',
    '656052a2-2e3e-467b-88ba-63a9ea5e4a54',
    '82182c28-9883-4aa4-8807-7cd781e6ca5b',
    'daafd3d5-3c8d-42d1-8f3d-100341b1d0b4',
    '6b4d50c0-e6e3-4126-b658-e98a8001588a',
    '802bdb62-11bc-4a31-9e71-cef8dad121ea',
    'c0dea89f-4ea8-45a3-856d-cad1d5bbe374',
    '1d8129a2-6f29-4966-abfd-763ecd07d4bc',
    '1c5c13c8-30b4-4935-8116-6b0d878cf02d',
    '499e9da8-c26a-4179-b929-69dc49f46ad1',
  ],
  other_config: {
    'i18n-original-value-name_label': 'Local storage',
    'i18n-key': 'local-storage',
  },
  sm_config: {
    devserial: 'scsi-35707c181005e11cd',
  },
  $container: '84e555d8-267a-4720-aa5f-fd19035aadae',
  $PBDs: ['387a2513-e835-baba-5684-e4a104acd78b'],
  id: 'c4284e12-37c9-7967-b9e8-83ef229c3e03',
  uuid: 'c4284e12-37c9-7967-b9e8-83ef229c3e03',
  $pool: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
  $poolId: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
  _xapiRef: 'OpaqueRef:a7bf6969-0e15-9fa5-f987-8515fee801c5',
}

export const nfsExport = [
  {
    path: '/srv/nfs',
    acl: '(everyone)',
  },
]

export const srUuids = [
  {
    uuid: 'd4e4d9b8-2c7e-46fd-9b53-6b8e5d6b2f4a',
  },
  {
    uuid: '8f4c6a91-3b7d-4d7a-a9e3-2c9b6d5e7f81',
  },
  {
    uuid: '1b7f3d54-9d2e-4c1a-8f67-5a9e2c3d4b10',
  },
  {
    uuid: 'f2c8a6e3-7d19-4b2e-9a65-1d8f3c7b5e92',
  },
]

export const hbaExport = [
  {
    vendor: 'Generic Storage',
    size: 1099511627776,
    serial: 'SN123456789',
    scsiId: '3600508b400105e210000900000490000',
    path: '/dev/sdb',
    lun: 0,
    id: 'hba-device-1',
    hba: 'host0',
  },
  {
    vendor: 'Storage Vendor',
    size: 2199023255552,
    serial: 'SN987654321',
    scsiId: '3600a0980383134564d2b4a6b6c4d6578',
    path: '/dev/sdc',
    lun: 1,
    id: 'hba-device-2',
    hba: 'host0',
  },
]

export const iscsiIqnExport = [
  {
    ip: '192.168.1.10',
    iqn: 'iqn.2026-07.local.storage:target1',
  },
  {
    ip: '192.168.1.11',
    iqn: 'iqn.2026-07.local.storage:target2',
  },
  {
    ip: '10.0.0.20',
    iqn: 'iqn.2026-07.example:iscsi.disk01',
  },
  {
    ip: '10.0.0.21',
    iqn: 'iqn.2026-07.example:iscsi.disk02',
  },
]

export const iscsiLunExport = [
  {
    scsiId: '3600508b400105e210000900000490000',
    size: '1 TiB',
    serial: 'SN123456789',
    vendor: 'Generic Storage',
    id: 'lun-1',
  },
  {
    scsiId: '3600a0980383134564d2b4a6b6c4d6578',
    size: '2 TiB',
    serial: 'SN987654321',
    vendor: 'Storage Vendor',
    id: 'lun-2',
  },
  {
    scsiId: '3624a9370c8b1f23456789abcdef12345',
    size: '500 GiB',
    serial: 'SN456789123',
    vendor: 'Example Storage',
    id: 'lun-3',
  },
  {
    scsiId: '3600c0ff00029a1b2c3d4e5f678901234',
    size: '4 TiB',
    serial: 'SN321654987',
    vendor: 'Virtual SAN',
    id: 'lun-4',
  },
]
