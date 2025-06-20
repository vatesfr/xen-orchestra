export const smIds = [
  '/rest/v0/sms/5bfb2f8a-70f3-8cff-1748-3cd4de2153da',
  '/rest/v0/sms/d3df5d0f-bac8-ed31-22e9-b7d89fb39e0e',
]

export const partialSms = [
  {
    type: 'SM',
    uuid: '5bfb2f8a-70f3-8cff-1748-3cd4de2153da',
    name_description:
      'SR plugin which represents disks as VHD and QCOW2 files stored on a local EXT4 filesystem, created inside an LVM volume',
    name_label: 'Local EXT4 VHD and QCOW2',
    SM_type: 'ext',
  },
  {
    uuid: 'd3df5d0f-bac8-ed31-22e9-b7d89fb39e0e',
    name_label: 'LVM over iSCSI',
    SM_type: 'lvmoiscsi',
    name_description:
      'SR plugin which represents disks as Logical Volumes within a Volume Group created on an iSCSI LUN',
    href: '/rest/v0/sms/d3df5d0f-bac8-ed31-22e9-b7d89fb39e0e',
  },
  {
    uuid: '59f03885-4a01-84f5-e6bc-b4357596f40e',
    name_label: 'dummy',
    SM_type: 'dummy',
    name_description: 'SR plugin which manages fake data',
    href: '/rest/v0/sms/59f03885-4a01-84f5-e6bc-b4357596f40e',
  },
  {
    uuid: '3797ca0a-fcdb-07ed-235f-277d1c77f329',
    name_label: 'GlusterFS VHD and QCOW2',
    SM_type: 'glusterfs',
    name_description: 'SR plugin which stores disks as VHD and QCOW2 files on a GlusterFS storage',
    href: '/rest/v0/sms/3797ca0a-fcdb-07ed-235f-277d1c77f329',
  },
]

export const sm = {
  type: 'SM',
  uuid: '5bfb2f8a-70f3-8cff-1748-3cd4de2153da',
  name_description:
    'SR plugin which represents disks as VHD and QCOW2 files stored on a local EXT4 filesystem, created inside an LVM volume',
  name_label: 'Local EXT4 VHD and QCOW2',
  SM_type: 'ext',
  configuration: {
    device: 'local device path (required) (e.g. /dev/sda3)',
  },
  vendor: 'Citrix Systems Inc',
  features: {
    SR_PROBE: 1,
    SR_SUPPORTS_LOCAL_CACHING: 1,
    SR_UPDATE: 1,
    THIN_PROVISIONING: 1,
    VDI_ACTIVATE: 1,
    VDI_ATTACH: 1,
    VDI_CLONE: 1,
    VDI_CONFIG_CBT: 1,
    VDI_CREATE: 1,
    VDI_DEACTIVATE: 1,
    VDI_DELETE: 1,
    VDI_DETACH: 1,
    VDI_GENERATE_CONFIG: 1,
    VDI_MIRROR: 1,
    VDI_READ_CACHING: 1,
    VDI_RESET_ON_BOOT: 2,
    VDI_RESIZE: 1,
    VDI_SNAPSHOT: 1,
    VDI_UPDATE: 1,
  },
  driver_filename: '/opt/xensource/sm/EXTSR',
  required_cluster_stack: [],
  supported_image_formats: [],
  id: '5bfb2f8a-70f3-8cff-1748-3cd4de2153da',
  pool: 'd6ba2603-7f16-0261-a33f-6e91d3aa0ec7',
  poolId: 'd6ba2603-7f16-0261-a33f-6e91d3aa0ec7',
  _xapiRef: 'OpaqueRef:27086ace-74d7-9f68-7465-346c7249b799',
  href: '/rest/v0/sms/5bfb2f8a-70f3-8cff-1748-3cd4de2153da',
}
