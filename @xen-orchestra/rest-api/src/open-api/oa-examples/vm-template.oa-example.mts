export const vmTemplateIds = [
  '/rest/v0/vm-templates/fe3d015b-d08e-1c68-9587-64aff7f9e5f5-7279a78a-4756-4fc3-99f0-3e7694c0319e',
  '/rest/v0/vm-templates/fe3d015b-d08e-1c68-9587-64aff7f9e5f5-a3d70e4d-c5ac-4dfb-999b-30a0a7efe546',
]

export const partialVmTemplates = [
  {
    id: 'fe3d015b-d08e-1c68-9587-64aff7f9e5f5-7279a78a-4756-4fc3-99f0-3e7694c0319e',
    isDefaultTemplate: true,
    name_label: 'NeoKylin Linux Server 7',
    href: '/rest/v0/vm-templates/fe3d015b-d08e-1c68-9587-64aff7f9e5f5-7279a78a-4756-4fc3-99f0-3e7694c0319e',
  },
  {
    id: 'fe3d015b-d08e-1c68-9587-64aff7f9e5f5-a3d70e4d-c5ac-4dfb-999b-30a0a7efe546',
    isDefaultTemplate: true,
    name_label: 'CentOS Stream 9',
    href: '/rest/v0/vm-templates/fe3d015b-d08e-1c68-9587-64aff7f9e5f5-a3d70e4d-c5ac-4dfb-999b-30a0a7efe546',
  },
]

export const vmTemplate = {
  type: 'VM-template',
  addresses: {},
  auto_poweron: false,
  bios_strings: {},
  blockedOperations: {},
  boot: {
    firmware: 'bios',
    order: 'cdn',
  },
  CPUs: {
    max: 1,
    number: 1,
  },
  current_operations: {},
  expNestedHvm: false,
  viridian: false,
  high_availability: '',
  isFirmwareSupported: true,
  memory: {
    dynamic: [4294967296, 4294967296],
    static: [2147483648, 4294967296],
    size: 4294967296,
  },
  installTime: null,
  name_description:
    'To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http://<server>/<path> or nfs:server:/<path>',
  name_label: 'Oracle Linux 7',
  needsVtpm: false,
  other: {
    default_template: 'true',
    import_task: 'OpaqueRef:335a2d25-736f-77aa-bd27-1016e2e4d29f',
    mac_seed: 'f11d04a8-64cc-468a-b079-17039a67cf8c',
    linux_template: 'true',
    'install-methods': 'cdrom,nfs,http,ftp',
    disks: '<provision><disk bootable="true" device="0" size="10737418240" sr="" type="system"/></provision>',
  },
  os_version: null,
  power_state: 'Halted',
  hasVendorDevice: false,
  snapshots: [],
  startDelay: 0,
  startTime: null,
  secureBoot: false,
  tags: [],
  VIFs: [],
  VTPMs: [],
  virtualizationMode: 'hvm',
  $container: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
  $VBDs: [],
  VGPUs: [],
  $VGPUs: [],
  xenStoreData: {},
  vga: 'std',
  videoram: '8',
  id: 'b7569d99-30f8-178a-7d94-801de3e29b5b-f873abe0-b138-4995-8f6f-498b423d234d',
  isDefaultTemplate: true,
  template_info: {
    disks: [
      {
        bootable: true,
        device: '0',
        size: 10737418240,
        type: 'system',
        SR: '',
      },
    ],
    install_methods: ['cdrom', 'nfs', 'http', 'ftp'],
  },
  uuid: 'f873abe0-b138-4995-8f6f-498b423d234d',
  $pool: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
  $poolId: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
  _xapiRef: 'OpaqueRef:3a9b74fe-57d5-52f7-31ec-fbb0de9e8a1e',
}
