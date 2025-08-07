export const jobIds = [
  '/rest/v0/backup/jobs/vm/d2511443-5fef-4750-b59e-7eca01d1eaab',
  '/rest/v0/backup/jobs/vm/73a76f43-c5cf-4644-878d-1f6c0e41c8b8',
]

export const partialJobs = [
  {
    name: 'Azurite delta',
    type: 'backup',
    remotes: {
      id: 'a72c53c1-eae1-43f6-be6d-7b0342a1f218',
    },
    href: '/rest/v0/backup/jobs/vm/d2511443-5fef-4750-b59e-7eca01d1eaab',
  },
  {
    name: 'Backup QA Auto',
    type: 'backup',
    remotes: {
      id: 'a72c53c1-eae1-43f6-be6d-7b0342a1f218',
    },
    href: '/rest/v0/backup/jobs/vm/73a76f43-c5cf-4644-878d-1f6c0e41c8b8',
  },
]

export const job = {
  name: 'Azurite delta',
  mode: 'delta',
  settings: {
    '': {
      timezone: 'Europe/Paris',
      preferNbd: true,
    },
    'ee3d0a7c-6f4c-4664-822cdc4953f2a571': {
      exportRetention: 1,
    },
  },
  remotes: {
    id: 'a72c53c1-eae1-43f6-be6d-7b0342a1f218',
  },
  vms: {
    id: '7b894929-273e-15f4-b7df-88a497d90c14',
  },
  type: 'backup',
  srs: {
    id: {
      __or: [],
    },
  },
  id: 'd2511443-5fef-4750-b59e-7eca01d1eaab',
}
