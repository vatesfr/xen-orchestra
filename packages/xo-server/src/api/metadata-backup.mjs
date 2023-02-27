export function createJob({ schedules, ...job }) {
  job.userId = this.apiContext.user.id
  return this.createMetadataBackupJob(job, schedules)
}

createJob.permission = 'admin'
createJob.params = {
  name: {
    type: 'string',
    optional: true,
  },
  pools: {
    type: 'object',
    optional: true,
  },
  proxy: {
    type: 'string',
    optional: true,
  },
  remotes: {
    type: 'object',
  },
  schedules: {
    type: 'object',
  },
  settings: {
    type: 'object',
  },
  xoMetadata: {
    type: 'boolean',
    optional: true,
  },
}

export function getAllJobs() {
  return this.getAllJobs('metadataBackup')
}

getAllJobs.permission = 'admin'

export function getJob({ id }) {
  return this.getJob(id, 'metadataBackup')
}

getJob.permission = 'admin'
getJob.params = {
  id: {
    type: 'string',
  },
}

export function deleteJob({ id }) {
  return this.deleteMetadataBackupJob(id)
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
  name: {
    type: 'string',
    optional: true,
  },
  pools: {
    type: ['object', 'null'],
    optional: true,
  },
  proxy: {
    type: ['string', 'null'],
    optional: true,
  },
  settings: {
    type: 'object',
    optional: true,
  },
  remotes: {
    type: 'object',
    optional: true,
  },
  xoMetadata: {
    type: 'boolean',
    optional: true,
  },
}

export async function runJob({ id, schedule }) {
  return this.runJobSequence([id], await this.getSchedule(schedule))
}

runJob.permission = 'admin'

runJob.params = {
  id: {
    type: 'string',
  },
  schedule: {
    type: 'string',
  },
}

export async function list({ remotes }) {
  return this.listMetadataBackups(remotes)
}

list.permission = 'admin'

list.params = {
  remotes: {
    type: 'array',
    items: {
      type: 'string',
    },
  },
}

export function restore({ id, pool }) {
  if (pool !== undefined) {
    const poolObj = this.getXapiObject(pool, 'pool')
    return this.restoreMetadataBackup({ id, poolUuid: poolObj.uuid })
  } else {
    return this.restoreMetadataBackup({ id })
  }
}

restore.permission = 'admin'

restore.params = {
  id: {
    type: 'string',
  },
  pool: {
    type: 'string',
    optional: true,
  },
}

function delete_({ id }) {
  return this.deleteMetadataBackup(id)
}
delete_.permission = 'admin'

delete_.params = {
  id: {
    type: 'string',
  },
}
export { delete_ as delete }
