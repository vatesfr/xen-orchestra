export const vmBackupJobIds = [
  '/rest/v0/backup-jobs/d33f3dc1-92b4-469c-ad58-4c2a106a4721',
  '/rest/v0/backup-jobs/01d8c371-d8aa-4690-b3f2-e006e07c7681',
]

export const metadataBackupJobIds = [
  '/rest/v0/backup-jobs/b50f95fd-f6b7-4027-87b6-6a02c7dcd5f5',
  '/rest/v0/backup-jobs/b49f25fb-f5c1-3377-87b6-6a02c7dbd2c6',
]

export const mirrorBackupJobIds = [
  '/rest/v0/backup-jobs/34979df2-2fb3-4a11-8b12-19d9b15f014c',
  '/rest/v0/backup-jobs/e680c14c-ab52-45c8-bb0e-bd4ca12ea8f9',
]

export const partialVmBackupJobs = [
  {
    name: 'toto',
    mode: 'full',
    type: 'backup',
    id: 'd33f3dc1-92b4-469c-ad58-4c2a106a4721',
    href: '/rest/v0/backup-jobs/d33f3dc1-92b4-469c-ad58-4c2a106a4721',
  },
  {
    name: 'zae',
    mode: 'full',
    type: 'mirrorBackup',
    id: '01d8c371-d8aa-4690-b3f2-e006e07c7681',
    href: '/rest/v0/backup-jobs/01d8c371-d8aa-4690-b3f2-e006e07c7681',
  },
]

export const partialMetadataBackupJobs = [
  {
    name: 'another-test',
    xoMetadata: true,
    id: 'b49f25fb-f5c1-3377-87b6-6a02c7dcd5f5',
    href: '/rest/v0/backup-jobs/b49f25fb-f5c1-3377-87b6-6a02c7dcd5f5',
  },
  {
    name: 'test',
    xoMetadata: true,
    id: 'b50f95fd-f6b7-4027-87b6-6a02c7dcd5f5',
    href: '/rest/v0/backup-jobs/b50f95fd-f6b7-4027-87b6-6a02c7dcd5f5',
  },
]

export const partialMirrorBackupJobs = [
  {
    name: 'tata-bis',
    mode: 'delta',
    id: '34979df2-2fb3-4a11-8b12-19d9b15f014c',
    href: '/rest/v0/backup-jobs/34979df2-2fb3-4a11-8b12-19d9b15f014c',
  },
  {
    name: 'tata',
    mode: 'delta',
    id: 'e680c14c-ab52-45c8-bb0e-bd4ca12ea8f9',
    href: '/rest/v0/backup-jobs/e680c14c-ab52-45c8-bb0e-bd4ca12ea8f9',
  },
]

export const vmBackupJob = {
  name: 'toto',
  mode: 'full',
  settings: {
    '': {
      timezone: 'Europe/Paris',
    },
    '7f9f4e0a-30d0-419f-9726-f43d8d55c6fe': {
      snapshotRetention: 1,
    },
  },
  vms: {
    type: 'VM',
    power_state: 'Running',
  },
  type: 'backup',
  remotes: {
    id: {
      __or: [],
    },
  },
  srs: {
    id: {
      __or: [],
    },
  },
  id: 'd33f3dc1-92b4-469c-ad58-4c2a106a4721',
}

export const metadataBackupJob = {
  name: 'test',
  remotes: {
    id: '1af95910-01b4-4e87-9c2f-d895cafe0776',
  },
  settings: {
    '7653af2d-c9c6-4b31-9cbc-fdb5f296c4e5': {
      retentionXoMetadata: 1,
    },
  },
  xoMetadata: true,
  userId: 'e531b8c9-3876-4ed9-8fd2-0476d5f825c9',
  type: 'metadataBackup',
  id: 'b50f95fd-f6b7-4027-87b6-6a02c7dcd5f5',
}

export const mirrorBackupJob = {
  name: 'tata',
  mode: 'delta',
  sourceRemote: '1af95910-01b4-4e87-9c2f-d895cafe0776',
  remotes: {
    id: {
      __or: ['1af95910-01b4-4e87-9c2f-d895cafe0776', '4d4c8be8-5815-42af-82ad-b413d45b2d38'],
    },
  },
  settings: {
    '8f34ee22-9b3b-4c70-a776-920c533e4844': {
      exportRetention: 1,
      healthCheckVmsWithTags: ['aze'],
      healthCheckSr: 'c787b75c-3e0d-70fa-d0c3-cbfd382d7e33',
    },
    '': {
      concurrency: 1,
      nRetriesVmBackupFailures: 1,
      timeout: 3600000,
      maxExportRate: 1048576,
      backupReportTpl: 'compactMjml',
      hideSuccessfulItems: true,
      reportWhen: 'failure',
    },
  },
  type: 'mirrorBackup',
  proxy: '83050a39-44e2-4e59-b612-860250ce9338',
  id: 'e680c14c-ab52-45c8-bb0e-bd4ca12ea8f9',
}
