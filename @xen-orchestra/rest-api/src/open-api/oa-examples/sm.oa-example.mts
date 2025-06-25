export const smIds = [
  '/rest/v0/sms/5bfb2f8a-70f3-8cff-1748-3cd4de2153da',
  '/rest/v0/sms/d3df5d0f-bac8-ed31-22e9-b7d89fb39e0e',
]

export const partialSms = [
  {
    uuid: '5bfb2f8a-70f3-8cff-1748-3cd4de2153da',
    name_label: 'Local EXT4 VHD and QCOW2',
    SM_type: 'ext',
    href: '/rest/v0/sms/5bfb2f8a-70f3-8cff-1748-3cd4de2153da',
  },
  {
    uuid: '0d48516d-f7ad-1c36-39ea-17cfb16e04ab',
    name_label: 'Local EXT4 VHD and QCOW2',
    SM_type: 'ext',
    href: '/rest/v0/sms/0d48516d-f7ad-1c36-39ea-17cfb16e04ab',
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
