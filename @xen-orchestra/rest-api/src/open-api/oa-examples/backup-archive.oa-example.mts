export const backupArchiveIds = [
  '/rest/v0/backup-archives/231264c3-af43-4ec0-a3be-394c5b1fdbfc//xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/20250801T080832Z.json',
  '/rest/v0/backup-archives/1af95910-01b4-4e87-9c2f-d895cafe0776//xo-vm-backups/7cf6150f-a978-09e6-6b41-0d1d41967bdc/20250918T132942Z.json',
]

export const partialBackupArchives = [
  {
    id: '231264c3-af43-4ec0-a3be-394c5b1fdbfc//xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/20250801T080832Z.json',
    backupRepository: '231264c3-af43-4ec0-a3be-394c5b1fdbfc',
    disks: [
      {
        id: '/xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/vdis/8b650248-ddd6-4188-ad8b-c0502865ac6c/f1f3c902-dcaa-4ec6-943e-6162c9d85fb2/20250801T080832Z.vhd',
        name: 'debian 12 hub disk',
        uuid: 'cbe1e3ba-8e5c-4c79-9e4d-708144518d50',
      },
      {
        id: '/xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/vdis/8b650248-ddd6-4188-ad8b-c0502865ac6c/870e6142-d4e4-4622-bd19-6b101c8da3cc/20250801T080832Z.vhd',
        name: 'XO CloudConfigDrive',
        uuid: 'bea8193d-80ba-4a72-94e4-901f03ffc225',
      },
    ],
    href: '/rest/v0/backup-archives/231264c3-af43-4ec0-a3be-394c5b1fdbfc/xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/20250801T080832Z.json',
  },
  {
    id: '1af95910-01b4-4e87-9c2f-d895cafe0776//xo-vm-backups/7cf6150f-a978-09e6-6b41-0d1d41967bdc/20250918T132942Z.json',
    backupRepository: '1af95910-01b4-4e87-9c2f-d895cafe0776',
    disks: [
      {
        id: '/xo-vm-backups/803c2676-c309-721e-7123-e6c3de854c32/vdis/ce91bf34-099c-4241-a608-3373f101c02b/7384cf5a-3202-4a21-bfd0-8da467449fa6/20250916T144850Z.vhd',
        name: 'AlmaLinux 9_ivopu',
        uuid: '73ed06ed-fdc8-43ef-a1c4-253e9005fbe0',
      },
    ],
    href: '/rest/v0/backup-archives/1af95910-01b4-4e87-9c2f-d895cafe0776//xo-vm-backups/7cf6150f-a978-09e6-6b41-0d1d41967bdc/20250918T132942Z.json',
  },
]

export const backupArchive = {
  type: 'xo-vm-backup',
  backupRepository: '1af95910-01b4-4e87-9c2f-d895cafe0776',
  disks: [
    {
      id: '/xo-vm-backups/7cf6150f-a978-09e6-6b41-0d1d41967bdc/vdis/f2599aa4-7bb4-434b-bf71-cf0ebe1e06a4/007e4f3e-6315-4779-aab5-461b519836f3/20250918T132942Z.alias.vhd',
      name: 'min-alpine-mra_alegi',
      uuid: 'c922ef3c-9d76-4482-87f8-a4da5849ee45',
    },
  ],
  id: '1af95910-01b4-4e87-9c2f-d895cafe0776//xo-vm-backups/7cf6150f-a978-09e6-6b41-0d1d41967bdc/20250918T132942Z.json',
  jobId: 'f2599aa4-7bb4-434b-bf71-cf0ebe1e06a4',
  mode: 'delta',
  scheduleId: '8db1c2da-2635-436f-8f78-62079fea3aa6',
  size: 0,
  timestamp: 1758202182963,
  vm: {
    uuid: '7cf6150f-a978-09e6-6b41-0d1d41967bdc',
    name_description: 'test vm used for demo',
    name_label: 'mra_vtp_test',
    tags: ['tag_1'],
  },
  differencingVhds: 1,
  dynamicVhds: 0,
  withMemory: false,
}
