export const vmControllerIds = [
  '/rest/v0/vm-controller/9b4775bd-9493-490a-9afa-f786a44caa4f',
  '/rest/v0/vm-controller/e3fc847c-159a-48dc-bee4-cf2da216a795',
]

export const partialVmControllers = [
  {
    type: 'VM-controller',
    uuid: '9b4775bd-9493-490a-9afa-f786a44caa4f',
    href: '/rest/v0/vm-controller/9b4775bd-9493-490a-9afa-f786a44caa4f',
  },
  {
    type: 'VM-controller',
    uuid: 'e3fc847c-159a-48dc-bee4-cf2da216a795',
    href: '/rest/v0/vm-controller/e3fc847c-159a-48dc-bee4-cf2da216a795',
  },
]

export const vmController = {
  type: 'VM-controller',
  addresses: {},
  affinityHost: 'b61a5c92-700e-4966-a13b-00633f03eea8',
  auto_poweron: false,
  bios_strings: {},
  blockedOperations: {},
  boot: {},
  CPUs: {
    max: 8,
    number: 8,
  },
  current_operations: {},
  expNestedHvm: false,
  viridian: false,
  high_availability: '',
  isFirmwareSupported: true,
  memory: {
    dynamic: [2785017856, 2785017856],
    static: [2785017856, 2785017856],
    size: 2785017856,
  },
  installTime: null,
  name_description: 'The domain which manages physical devices and manages other domains',
  name_label: 'Control domain on host: localhost.localdomain',
  needsVtpm: false,
  other: {
    storage_driver_domain: 'OpaqueRef:254474d5-77b7-0947-da0f-af869dd2ca82',
    is_system_domain: 'true',
    perfmon:
      '<config><variable><name value="fs_usage"/><alarm_trigger_level value="0.9"/><alarm_trigger_period value="60"/><alarm_auto_inhibit_period value="3600"/></variable><variable><name value="mem_usage"/><alarm_trigger_level value="0.95"/><alarm_trigger_period value="60"/><alarm_auto_inhibit_period value="3600"/></variable><variable><name value="log_fs_usage"/><alarm_trigger_level value="0.9"/><alarm_trigger_period value="60"/><alarm_auto_inhibit_period value="3600"/></variable></config>',
  },
  os_version: null,
  power_state: 'Running',
  hasVendorDevice: false,
  snapshots: [],
  startDelay: 0,
  startTime: null,
  secureBoot: false,
  tags: [],
  VIFs: [],
  VTPMs: [],
  virtualizationMode: 'pv',
  xenTools: false,
  $containe: 'b61a5c92-700e-4966-a13b-00633f03eea8',
  $VBDs: [],
  VGPUs: [],
  $VGPUs: [],
  xenStoreData: {},
  PV_args: '',
  id: '9b4775bd-9493-490a-9afa-f786a44caa4f',
  uuid: '9b4775bd-9493-490a-9afa-f786a44caa4f',
  $pool: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
  $poolId: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
  _xapiRef: 'OpaqueRef:ca27fcfc-5083-d039-e752-2e6c3364bde9',
}
