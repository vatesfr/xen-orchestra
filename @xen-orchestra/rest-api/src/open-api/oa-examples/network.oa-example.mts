export const networkIds = [
  '/rest/v0/networks/9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f',
  '/rest/v0/networks/6b6ca0f5-6611-0636-4b0a-1fb1c8e96414',
]

export const partialNetworks = [
  {
    nbd: true,
    name_label: 'Host internal management network',
    id: '9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f',
    href: '/rest/v0/networks/9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f',
  },
  {
    nbd: true,
    name_label: 'Lab v2 (VLAN 11)',
    id: '6b6ca0f5-6611-0636-4b0a-1fb1c8e96414',
    href: '/rest/v0/networks/6b6ca0f5-6611-0636-4b0a-1fb1c8e96414',
  },
]

export const network = {
  automatic: false,
  bridge: 'xenapi',
  current_operations: {},
  defaultIsLocked: false,
  MTU: 1500,
  name_description:
    'Network on which guests will be assigned a private link-local IP address which can be used to talk XenAPI',
  name_label: 'Host internal management network',
  other_config: {
    is_guest_installer_network: 'true',
    is_host_internal_management_network: 'true',
    ip_begin: '169.254.0.1',
    ip_end: '169.254.255.254',
    netmask: '255.255.0.0',
  },
  tags: [],
  PIFs: [],
  VIFs: [
    '2d039fc8-e522-75db-34c9-536b9553bd5a',
    '38623621-d30e-0307-dcef-eb7ed6c69f0c',
    'cc4b090f-5ff1-254b-558f-f7ac237e6fc5',
    'a9f3d042-a2e1-102f-74fc-ff1df41c6eb3',
  ],
  nbd: false,
  insecureNbd: false,
  id: '9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f',
  type: 'network',
  uuid: '9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f',
  $pool: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
  $poolId: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
  _xapiRef: 'OpaqueRef:eb906e77-2221-5399-4a26-60f0ad069b61',
}
