import { basename } from 'path'
import { fromCallback } from 'promise-toolbox'
import { pipeline } from 'readable-stream'

import createNdJsonStream from '../_createNdJsonStream.mjs'
import { REMOVE_CACHE_ENTRY } from '../_pDebounceWithKey.mjs'
import { safeDateFormat } from '../utils.mjs'
import { VirtualStorageRepository } from '../../../../@xen-orchestra/fuse-backup-repository/dist/index.mjs'
import { openDiskChain } from '@xen-orchestra/backups/disks/openDiskChain.mjs'
import { getHandler } from '@xen-orchestra/fs'
import { ConsumerQcowRaw } from '@xen-orchestra/qcow2'

const SCHEMA_SETTINGS = {
  type: 'object',
  properties: {
    '*': {
      type: 'object',
      properties: {
        cbtDestroySnapshotData: {
          type: 'boolean',
          optional: true,
        },
        concurrency: {
          type: 'number',
          minimum: 0,
          optional: true,
        },
        longTermRetention: {
          type: 'object',
          optional: true,
        },
        maxExportRate: {
          type: 'number',
          minimum: 0,
          optional: true,
        },
        nbdConcurrency: {
          type: 'number',
          minimum: 1,
          optional: true,
        },
        nRetriesVmBackupFailures: {
          minimum: 0,
          optional: true,
          type: 'number',
        },
        preferNbd: {
          type: 'boolean',
          optional: true,
        },
        timezone: {
          type: 'string',
          optional: true,
        },
        distributeBackups: {
          type: 'boolean',
          optional: true,
        },
        distributeReplications: {
          type: 'boolean',
          optional: true,
        },
      },
      additionalProperties: true,
    },
  },
  optional: true,
}

export function createJob({ schedules, ...job }) {
  return this.createBackupNgJob('backup', job, schedules).then(({ id }) => id)
}

createJob.permission = 'admin'
createJob.params = {
  compression: {
    enum: ['', 'native', 'zstd'],
    optional: true,
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
  remotes: {
    type: 'object',
    optional: true,
  },
  schedules: {
    type: 'object',
    optional: true,
  },
  settings: SCHEMA_SETTINGS,
  srs: {
    type: 'object',
    optional: true,
  },
  vms: {
    type: 'object',
  },
}

export function getSuggestedExcludedTags() {
  return ['Continuous Replication', 'Disaster Recovery', this.config.get('xo-proxy.vmTag')]
}

export function deleteJob({ id }) {
  return this.deleteBackupNgJob(id, 'backup')
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
  compression: {
    enum: ['', 'native', 'zstd'],
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
  proxy: {
    type: ['string', 'null'],
    optional: true,
  },
  remotes: {
    type: 'object',
    optional: true,
  },
  settings: SCHEMA_SETTINGS,
  srs: {
    type: 'object',
    optional: true,
  },
  vms: {
    type: 'object',
    optional: true,
  },
}

export function getAllJobs() {
  return this.getAllJobs('backup')
}

getAllJobs.permission = 'admin'

export function getJob({ id }) {
  return this.getJob(id, 'backup')
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

// -----------------------------------------------------------------------------

async function handleGetAllLogs(req, res) {
  const logs = await this.getBackupNgLogs()
  res.set('Content-Type', 'application/json')
  return fromCallback(pipeline, createNdJsonStream(logs), res)
}

export function getAllLogs({ ndjson = false }) {
  return ndjson
    ? this.registerHttpRequest(handleGetAllLogs).then($getFrom => ({
        $getFrom,
      }))
    : this.getBackupNgLogs()
}

getAllLogs.permission = 'admin'

getAllLogs.params = {
  ndjson: { type: 'boolean', optional: true },
}

export function getLogs({
  after,
  before,
  limit,

  // TODO: it's a temporary work-around which should be removed
  // when the consolidated logs will be stored in the DB
  _forceRefresh = false,

  ...filter
}) {
  if (_forceRefresh) {
    this.getBackupNgLogs(REMOVE_CACHE_ENTRY)
  }
  return this.getBackupNgLogsSorted({ after, before, limit, filter })
}

getLogs.permission = 'admin'

getLogs.params = {
  after: { type: ['number', 'string'], optional: true },
  before: { type: ['number', 'string'], optional: true },
  limit: { type: 'number', optional: true },
  '*': {},
}

// -----------------------------------------------------------------------------

export function deleteVmBackup({ id }) {
  return this.deleteVmBackupNg(id)
}

deleteVmBackup.permission = 'admin'

deleteVmBackup.params = {
  id: {
    type: 'string',
  },
}

export function deleteVmBackups({ ids }) {
  return this.deleteVmBackupsNg(ids)
}

deleteVmBackups.permission = 'admin'

deleteVmBackups.params = {
  ids: {
    type: 'array',
    items: { type: 'string' },
  },
}

export function listVmBackups({ remotes, _forceRefresh }) {
  return this.listVmBackupsNg(remotes, { _forceRefresh })
}

listVmBackups.permission = 'admin'

listVmBackups.params = {
  _forceRefresh: { type: 'boolean', optional: true },
  remotes: {
    type: 'array',
    items: {
      type: 'string',
    },
  },
}

export function importVmBackup({ id, settings, sr }) {
  return this.importVmBackupNg(id, sr, settings)
}

importVmBackup.permission = 'admin'

importVmBackup.params = {
  id: {
    type: 'string',
  },
  settings: {
    type: 'object',
  },
  sr: {
    type: 'string',
  },
  useDifferentialRestore: {
    type: 'boolean',
    optional: true,
  },
}

export function checkBackup({ id, settings, sr }) {
  return this.checkVmBackupNg(id, sr, settings)
}

checkBackup.permission = 'admin'

checkBackup.params = {
  id: {
    type: 'string',
  },
  settings: {
    type: 'object',
  },
  sr: {
    type: 'string',
  },
}

// -----------------------------------------------------------------------------

export function listPartitions({ remote, disk }) {
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

export function listFiles({ remote, disk, partition, path }) {
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

async function handleFetchFiles(req, res, { remote, disk, format, partition, paths }) {
  const stream = await this.fetchBackupNgPartitionFiles(remote, disk, partition, paths, format)

  res.setHeader('content-disposition', 'attachment')
  res.setHeader('content-type', 'application/octet-stream')
  return stream
}

export async function fetchFiles(params) {
  const { format, paths } = params
  let filename = `restore_${safeDateFormat(new Date())}`
  if (paths.length === 1) {
    filename += `_${basename(paths[0])}`
  }
  filename += '.' + format

  return this.registerHttpRequest(handleFetchFiles, params, {
    suffix: '/' + encodeURIComponent(filename),
  }).then(url => ({ $getFrom: url }))
}

fetchFiles.permission = 'admin'

fetchFiles.params = {
  disk: {
    type: 'string',
  },
  format: {
    type: 'string',
    default: 'tgz',
  },
  partition: {
    optional: true,
    type: 'string',
  },
  paths: {
    items: { type: 'string' },
    minItems: 1,
    type: 'array',
  },
  remote: {
    type: 'string',
  },
}

export function listMountedPartitions() {
  return this.listMountedPartitions()
}

listMountedPartitions.permission = 'admin'

export function mountPartition({ remote, disk, partition }) {
  return this.mountPartition(remote, disk, partition)
}

mountPartition.permission = 'admin'

mountPartition.params = {
  disk: {
    type: 'string',
  },
  partition: {
    optional: true,
    type: 'string',
  },
  remote: {
    type: 'string',
  },
}

export function unmountPartition({ remote, disk, partition }) {
  return this.unmountPartition(remote, disk, partition)
}

unmountPartition.permission = 'admin'

unmountPartition.params = {
  disk: {
    type: 'string',
  },
  partition: {
    optional: true,
    type: 'string',
  },
  remote: {
    type: 'string',
  },
}

export async function startVirtualSR({ pool, shareSourceIp }) {
  pool = this.getXapiObject(pool, 'pool')
  const xapi = pool.$xapi
  const vsr = new VirtualStorageRepository(xapi, shareSourceIp)
  await vsr.init()
  const handler = getHandler({ url: 'file:///mnt/ssd/vhdfile' })
  await handler.sync()
  const disk = await openDiskChain({
    handler,
    path: 'xo-vm-backups/c9f59906-8c53-ff71-c900-45a4a432c830/vdis/d8ddef60-d9a4-4cec-9546-522e9c75e356/0c89fe68-699a-491b-8b68-1dbe558ca14e/20260213T160730Z.vhd',
  })

  const qcow2 = new ConsumerQcowRaw(disk)
  await qcow2.init()
  vsr.addDisk(qcow2)
}

startVirtualSR.permission = 'admin'

startVirtualSR.resolve = {
  pool: ['pool', 'pool', 'administrate'],
}
startVirtualSR.params = {
  pool: {
    type: 'string',
  },
  shareSourceIp: {
    type: 'string',
  },
}
