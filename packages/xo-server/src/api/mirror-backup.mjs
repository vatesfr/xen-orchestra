const SCHEMA_SETTINGS = {
  type: 'object',
  properties: {
    '*': {
      type: 'object',
      properties: {
        concurrency: {
          type: 'number',
          minimum: 0,
          optional: true,
        },
        maxExportRate: {
          type: 'number',
          minimum: 0,
          optional: true,
        },
      },
      additionalProperties: true,
    },
  },
  optional: true,
}

// a filter properties is allowed
// for now it only support by VM uuid
const MIRROR_BACKUP_FILTER = {
  type: 'object',
  nullable: true,
  optional: true,
  properties: {
    vm: {
      properties: {
        uuid: {
          type: 'object',
          properties: {
            __or: {
              type: 'array',
              items: {
                type: 'string',
                minItems: 1,
              },
            },
          },
        },
      },
    },
  },
}

export function createJob({ schedules, ...job }) {
  return this.createBackupNgJob('mirrorBackup', job, schedules).then(({ id }) => id)
}

createJob.permission = 'admin'
createJob.params = {
  mode: {
    enum: ['full', 'delta'],
  },
  name: {
    type: 'string',
    optional: true,
  },
  proxy: {
    type: 'string',
    optional: true,
  },
  sourceRemote: {
    type: 'string',
  },
  remotes: {
    type: 'object',
  },
  schedules: {
    type: 'object',
    optional: true,
  },
  filter: MIRROR_BACKUP_FILTER,
  settings: SCHEMA_SETTINGS,
}

export function deleteJob({ id }) {
  return this.deleteBackupNgJob(id, 'mirrorBackup')
}
deleteJob.permission = 'admin'
deleteJob.params = {
  id: {
    type: 'string',
  },
}

export function editJob(props) {
  return this.updateJob(props)
}

editJob.permission = 'admin'
editJob.params = {
  id: {
    type: 'string',
  },
  mode: {
    enum: ['full', 'delta'],
  },
  name: {
    type: 'string',
    optional: true,
  },
  proxy: {
    type: 'string',
    optional: true,
  },
  sourceRemote: {
    type: 'string',
  },
  remotes: {
    type: 'object',
  },
  schedules: {
    type: 'object',
    optional: true,
  },
  filter: MIRROR_BACKUP_FILTER,
  settings: SCHEMA_SETTINGS,
}

export function getAllJobs() {
  return this.getAllJobs('mirrorBackup')
}

getAllJobs.permission = 'admin'

export function getJob({ id }) {
  return this.getJob(id, 'mirrorBackup')
}

getJob.permission = 'admin'

getJob.params = {
  id: {
    type: 'string',
  },
}

export async function runJob({ id, schedule, settings, vm, vms = vm !== undefined ? [vm] : undefined }) {
  return this.runJobSequence([id], await this.getSchedule(schedule), {
    settings,
    vms,
  })
}

runJob.permission = 'admin'

runJob.params = {
  id: {
    type: 'string',
  },
  schedule: {
    type: 'string',
  },
  settings: SCHEMA_SETTINGS,
  vm: {
    type: 'string',
    optional: true,
  },
  vms: {
    type: 'array',
    items: {
      type: 'string',
    },
    optional: true,
  },
}
