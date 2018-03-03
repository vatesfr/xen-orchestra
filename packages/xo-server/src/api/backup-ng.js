export function createJob ({ schedules, ...job }) {
  job.userId = this.user.id
  return this.createBackupNgJob(job, schedules)
}

createJob.permission = 'admin'
createJob.params = {
  compression: {
    enum: ['', 'native'],
    optional: true,
  },
  mode: {
    enum: ['full', 'delta'],
  },
  name: {
    type: 'string',
    optional: true,
  },
  remotes: {
    type: 'object',
    optional: true,
  },
  schedules: {
    type: 'object',
    optional: true,
  },
  settings: {
    type: 'object',
  },
  vms: {
    type: 'object',
  },
}

export function deleteJob ({ id }) {
  return this.deleteBackupNgJob(id)
}
deleteJob.permission = 'admin'
deleteJob.params = {
  id: {
    type: 'string',
  },
}

export function editJob (props) {
  return this.updateJob(props)
}

editJob.permission = 'admin'
editJob.params = {
  compression: {
    enum: ['', 'native'],
    optional: true,
  },
  id: {
    type: 'string',
  },
  mode: {
    enum: ['full', 'delta'],
    optional: true,
  },
  name: {
    type: 'string',
    optional: true,
  },
  remotes: {
    type: 'object',
    optional: true,
  },
  settings: {
    type: 'object',
    optional: true,
  },
  vms: {
    type: 'object',
    optional: true,
  },
}

export function getAllJobs () {
  return this.getAllBackupNgJobs()
}

getAllJobs.permission = 'admin'

export function getJob ({ id }) {
  return this.getBackupNgJob(id)
}

getJob.permission = 'admin'

getJob.params = {
  id: {
    type: 'string',
  },
}

export async function runJob ({ id, scheduleId }) {
  return this.runJobSequence([id], await this.getSchedule(scheduleId))
}

runJob.permission = 'admin'

runJob.params = {
  id: {
    type: 'string',
  },
  scheduleId: {
    type: 'string',
  },
}

// -----------------------------------------------------------------------------

export function deleteVmBackup ({ id }) {
  return this.deleteVmBackupNg(id)
}

deleteVmBackup.permission = 'admin'

deleteVmBackup.params = {
  id: {
    type: 'string',
  },
}

export function listVmBackups ({ remotes }) {
  return this.listVmBackupsNg(remotes)
}

listVmBackups.permission = 'admin'

listVmBackups.params = {
  remotes: {
    type: 'array',
    items: {
      type: 'string',
    },
  },
}

export function importVmBackup ({ id, sr }) {
  return this.importVmBackupNg(id, sr)
}

importVmBackup.permission = 'admin'

importVmBackup.params = {
  id: {
    type: 'string',
  },
  sr: {
    type: 'string',
  },
}
