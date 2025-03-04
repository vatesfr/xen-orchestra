export const vbdIds = [
  '/rest/v0/vms/5f9a4c0b-3548-6171-4396-699a0e56cc60',
  '/rest/v0/vms/60c7c9b6-35ba-1791-67b5-6aaf90eea11d',
]

export const partialVbds = [
  {
    device: 'xvda',
    bootable: false,
    uuid: '5f9a4c0b-3548-6171-4396-699a0e56cc60',
    href: '/rest/v0/vbds/5f9a4c0b-3548-6171-4396-699a0e56cc60',
  },
  {
    device: null,
    bootable: false,
    uuid: '60c7c9b6-35ba-1791-67b5-6aaf90eea11d',
    href: '/rest/v0/vbds/60c7c9b6-35ba-1791-67b5-6aaf90eea11d',
  },
]

export const vbd = {
  type: 'VBD',
  attached: false,
  bootable: false,
  device: 'xvda',
  is_cd_drive: false,
  position: '0',
  read_only: false,
  VDI: '656052a2-2e3e-467b-88ba-63a9ea5e4a54',
  VM: '4fe90510-8da4-1530-38e2-a7876ef374c7',
  id: '5f9a4c0b-3548-6171-4396-699a0e56cc60',
  uuid: '5f9a4c0b-3548-6171-4396-699a0e56cc60',
  $pool: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
  $poolId: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
  _xapiRef: 'OpaqueRef:fd30f949-d0ea-f3bc-c5da-cde875dad9db',
}
