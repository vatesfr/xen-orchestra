export const vdiSnapshotIds = [
  '/rest/v0/vdi-snapshots/d2727772-735b-478f-b6f9-11e7db56dfd0',
  '/rest/v0/vdi-snapshots/d0b9b037-097c-4af3-9e56-edb4331d51b2',
]

export const partialVdiSnapshots = [
  {
    uuid: 'd2727772-735b-478f-b6f9-11e7db56dfd0',
    snapshot_time: 1732707378,
    $snapshot_of: '5a914286-9f47-41ae-b9f7-2a1456ee0ce7',
    href: '/rest/v0/vdi-snapshots/d2727772-735b-478f-b6f9-11e7db56dfd0',
  },
  {
    uuid: 'd0b9b037-097c-4af3-9e56-edb4331d51b2',
    snapshot_time: 1725609856,
    href: '/rest/v0/vdi-snapshots/d0b9b037-097c-4af3-9e56-edb4331d51b2',
  },
]

export const vdiSnapshot = {
  type: 'VDI-snapshot',
  cbt_enabled: false,
  missing: false,
  name_description: 'Created by XO',
  name_label: 'Windows Server 2019 (64-bit)_iruti',
  size: 34359738368,
  snapshots: [],
  tags: [],
  usage: 8436632576,
  VDI_type: 'user',
  current_operations: {},
  other_config: {
    content_id: 'c6d140d1-3456-4a9a-aafd-097202de4e94',
  },
  $SR: 'c787b75c-3e0d-70fa-d0c3-cbfd382d7e33',
  $VBDs: ['bdfb401e-4828-97b2-f925-9dd185ae9eb4'],
  snapshot_time: 1732707378,
  $snapshot_of: '5a914286-9f47-41ae-b9f7-2a1456ee0ce7',
  id: 'd2727772-735b-478f-b6f9-11e7db56dfd0',
  uuid: 'd2727772-735b-478f-b6f9-11e7db56dfd0',
  $pool: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
  $poolId: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
  _xapiRef: 'OpaqueRef:89fa6fd2-321d-d7be-9ed1-3b810934793d',
}
