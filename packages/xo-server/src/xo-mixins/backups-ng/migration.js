// @flow

import assert from 'assert'

import { type BackupJob } from '../backups-ng'
import { type CallJob } from '../jobs'
import { type Schedule } from '../scheduling'

const createOr = (children: Array<any>): any => (children.length === 1 ? children[0] : { __or: children })

const methods = {
  'vm.deltaCopy': (job: CallJob, { _reportWhen: reportWhen, retention = 1, sr, vms }, schedule: Schedule) => ({
    mode: 'delta',
    settings: {
      '': reportWhen === undefined ? undefined : { reportWhen },
      [schedule.id]: {
        copyRetention: retention,
        vmTimeout: job.timeout,
      },
    },
    srs: { id: sr },
    userId: job.userId,
    vms,
  }),
  'vm.rollingDeltaBackup': (
    job: CallJob,
    { _reportWhen: reportWhen, depth = 1, retention = depth, remote, vms },
    schedule: Schedule
  ) => ({
    mode: 'delta',
    remotes: { id: remote },
    settings: {
      '': reportWhen === undefined ? undefined : { reportWhen },
      [schedule.id]: {
        exportRetention: retention,
        vmTimeout: job.timeout,
      },
    },
    vms,
  }),
  'vm.rollingDrCopy': (
    job: CallJob,
    { _reportWhen: reportWhen, deleteOldBackupsFirst, depth = 1, retention = depth, sr, vms },
    schedule: Schedule
  ) => ({
    mode: 'full',
    settings: {
      '': reportWhen === undefined ? undefined : { reportWhen },
      [schedule.id]: {
        deleteFirst: deleteOldBackupsFirst,
        copyRetention: retention,
        vmTimeout: job.timeout,
      },
    },
    srs: { id: sr },
    vms,
  }),
  'vm.rollingBackup': (
    job: CallJob,
    { _reportWhen: reportWhen, compress, depth = 1, retention = depth, remoteId, vms },
    schedule: Schedule
  ) => ({
    compression: compress ? 'native' : undefined,
    mode: 'full',
    remotes: { id: remoteId },
    settings: {
      '': reportWhen === undefined ? undefined : { reportWhen },
      [schedule.id]: {
        exportRetention: retention,
        vmTimeout: job.timeout,
      },
    },
    vms,
  }),
  'vm.rollingSnapshot': (
    job: CallJob,
    { _reportWhen: reportWhen, depth = 1, retention = depth, vms },
    schedule: Schedule
  ) => ({
    mode: 'full',
    settings: {
      '': reportWhen === undefined ? undefined : { reportWhen },
      [schedule.id]: {
        snapshotRetention: retention,
        vmTimeout: job.timeout,
      },
    },
    vms,
  }),
}

const parseParamsVector = (vector: any) => {
  assert.strictEqual(vector.type, 'crossProduct')
  const { items } = vector
  assert.strictEqual(items.length, 2)

  let vms, params
  if (items[1].type === 'map') {
    ;[params, vms] = items

    vms = vms.collection
    assert.strictEqual(vms.type, 'fetchObjects')
    vms = vms.pattern
  } else {
    ;[vms, params] = items

    assert.strictEqual(vms.type, 'set')
    vms = vms.values
    if (vms.length !== 0) {
      assert.deepStrictEqual(Object.keys(vms[0]), ['id'])
      vms = { id: createOr(vms.map(_ => _.id)) }
    }
  }

  assert.strictEqual(params.type, 'set')
  params = params.values
  assert.strictEqual(params.length, 1)
  params = params[0]

  return { ...params, vms }
}

export const translateLegacyJob = (job: CallJob, schedules: Schedule[]): BackupJob => {
  const { id } = job
  let method, schedule
  if (
    id.includes(':') ||
    job.type !== 'call' ||
    (method = methods[job.method]) === undefined ||
    (schedule = schedules.find(_ => _.jobId === id)) === undefined ||
    schedule.id.includes(':')
  ) {
    throw new Error(`cannot convert job ${job.id}`)
  }
  const params = parseParamsVector(job.paramsVector)
  return {
    id,
    name: params.tag || job.name,
    type: 'backup',
    userId: job.userId,
    // $FlowFixMe `method` is initialized but Flow fails to see this
    ...method(job, params, schedule),
  }
}
