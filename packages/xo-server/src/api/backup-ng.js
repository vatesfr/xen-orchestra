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

export async function runJob ({ id, schedule }) {
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

// - [ ] list of mounted partitions
// - [ ] partitions with unmount debounce
// - [ ] handle disks without partitions
// - [ ] handle disks with LVM partitions (recursive view)
// - [ ] handle directory restore
// - [ ] handle multiple entries restore (both dirs and files)
//       - [ ] by default use common path as root
// - [ ] handle LVM partitions on multiple disks
// - [ ] find mounted disks/partitions on start (in case of interruptions)
//
// - [ ] manual mount/unmount (of disk) for advance file restore
//       - could it stay mounted during the backup process?

// mountDisk (VHD)
// unmountDisk (only for manual mount)
// listPartitions
// listFiles
// fetchFiles
// getMountedDisks
//
// mountPartition (optional)
// getMountedPartitions
// unmountPartition
