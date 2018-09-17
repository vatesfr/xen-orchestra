import { basename } from 'path'
import { isEmpty, pickBy } from 'lodash'

import { safeDateFormat } from '../utils'

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
  srs: {
    type: 'object',
    optional: true,
  },
  vms: {
    type: 'object',
  },
}

export function migrateLegacyJob ({ id }) {
  return this.migrateLegacyBackupJob(id)
}
migrateLegacyJob.permission = 'admin'
migrateLegacyJob.params = {
  id: {
    type: 'string',
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
  srs: {
    type: 'object',
    optional: true,
  },
  vms: {
    type: 'object',
    optional: true,
  },
}

export function getAllJobs () {
  return this.getAllJobs('backup')
}

getAllJobs.permission = 'admin'

export function getJob ({ id }) {
  return this.getJob(id, 'backup')
}

getJob.permission = 'admin'

getJob.params = {
  id: {
    type: 'string',
  },
}

export async function runJob ({ id, schedule, vms }) {
  return this.runJobSequence([id], await this.getSchedule(schedule), vms)
}

runJob.permission = 'admin'

runJob.params = {
  id: {
    type: 'string',
  },
  schedule: {
    type: 'string',
  },
  vms: {
    type: 'array',
    items: {
      type: 'string',
    },
    optional: true,
  },
}

// -----------------------------------------------------------------------------

export async function getAllLogs (filter) {
  const logs = await this.getBackupNgLogs()
  return isEmpty(filter) ? logs : pickBy(logs, filter)
}

getAllLogs.permission = 'admin'

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

// -----------------------------------------------------------------------------

export function listPartitions ({ remote, disk }) {
  return this.listBackupNgDiskPartitions(remote, disk)
}

listPartitions.permission = 'admin'

listPartitions.params = {
  disk: {
    type: 'string',
  },
  remote: {
    type: 'string',
  },
}

export function listFiles ({ remote, disk, partition, path }) {
  return this.listBackupNgPartitionFiles(remote, disk, partition, path)
}

listFiles.permission = 'admin'

listFiles.params = {
  disk: {
    type: 'string',
  },
  partition: {
    type: 'string',
    optional: true,
  },
  path: {
    type: 'string',
  },
  remote: {
    type: 'string',
  },
}

async function handleFetchFiles (req, res, { remote, disk, partition, paths }) {
  const zipStream = await this.fetchBackupNgPartitionFiles(
    remote,
    disk,
    partition,
    paths
  )

  res.setHeader('content-disposition', 'attachment')
  res.setHeader('content-type', 'application/octet-stream')
  return zipStream
}

export async function fetchFiles (params) {
  const { paths } = params
  let filename = `restore_${safeDateFormat(new Date())}`
  if (paths.length === 1) {
    filename += `_${basename(paths[0])}`
  }
  filename += '.zip'

  return this.registerHttpRequest(handleFetchFiles, params, {
    suffix: encodeURI(`/${filename}`),
  }).then(url => ({ $getFrom: url }))
}

fetchFiles.permission = 'admin'

fetchFiles.params = {
  disk: {
    type: 'string',
  },
  partition: {
    optional: true,
    type: 'string',
  },
  paths: {
    items: { type: 'string' },
    minLength: 1,
    type: 'array',
  },
  remote: {
    type: 'string',
  },
}
