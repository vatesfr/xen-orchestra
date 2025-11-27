export const pbdIds = [
  '/rest/v0/pbds/16b2a60f-7c4d-f45f-7c7a-963b06fc587d',
  '/rest/v0/pbds/28d93f56-23cb-527c-080a-805e54593a0d',
]

export const partialPbds = [
  {
    attached: true,
    id: '16b2a60f-7c4d-f45f-7c7a-963b06fc587d',
    device_config: {
      device: '/dev/disk/by-id/ata-YP0120GWCGV_2H5020013956-part3',
    },
    href: '/rest/v0/pbds/16b2a60f-7c4d-f45f-7c7a-963b06fc587d',
  },
  {
    attached: true,
    id: '28d93f56-23cb-527c-080a-805e54593a0d',
    device_config: {
      path: '/opt/xensource/packages/iso',
      location: '/opt/xensource/packages/iso',
      legacy_mode: 'true',
    },
    href: '/rest/v0/pbds/28d93f56-23cb-527c-080a-805e54593a0d',
  },
]

export const pbd = {
  type: 'PBD',
  attached: true,
  host: '669df518-4e5d-4d84-b93a-9be2cdcdfca1',
  SR: '8aa2fb4a-143e-c2bc-05d4-c68bbb101d41',
  device_config: {
    device: '/dev/disk/by-id/ata-YP0120GWCGV_2H5020013956-part3',
  },
  otherConfig: {
    storage_driver_domain: 'OpaqueRef:6a7cfe18-1b68-205f-080a-3a64fb5f0e19',
  },
  id: '16b2a60f-7c4d-f45f-7c7a-963b06fc587d',
  uuid: '16b2a60f-7c4d-f45f-7c7a-963b06fc587d',
  $pool: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
  $poolId: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
  _xapiRef: 'OpaqueRef:fc6b3830-610b-adc8-2ea4-b7769f0931bf',
}
