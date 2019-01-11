// @flow

// $FlowFixMe
import type RemoteHandler from '@xen-orchestra/fs'
import asyncMap from '@xen-orchestra/async-map'
import createLogger from '@xen-orchestra/log'
import defer from 'golike-defer'
import limitConcurrency from 'limit-concurrency-decorator'
import { type Pattern, createPredicate } from 'value-matcher'
import { type Readable, PassThrough } from 'stream'
import { AssertionError } from 'assert'
import { basename, dirname } from 'path'
import {
  countBy,
  findLast,
  flatMap,
  forOwn,
  groupBy,
  isEmpty,
  last,
  mapValues,
  noop,
  some,
  sum,
  values,
} from 'lodash'
import {
  CancelToken,
  ignoreErrors,
  pFinally,
  pFromEvent,
} from 'promise-toolbox'
import Vhd, {
  chainVhd,
  checkVhdChain,
  createSyntheticStream as createVhdReadStream,
} from 'vhd-lib'

import type Logger from '../logs/loggers/abstract'
import { type CallJob, type Executor, type Job } from '../jobs'
import { type Schedule } from '../scheduling'

import createSizeStream from '../../size-stream'
import {
  type DeltaVmExport,
  type DeltaVmImport,
  type Vdi,
  type Vm,
  type Xapi,
  TAG_COPY_SRC,
} from '../../xapi'
import { getVmDisks } from '../../xapi/utils'
import {
  resolveRelativeFromFile,
  safeDateFormat,
  serializeError,
} from '../../utils'

import { translateLegacyJob } from './migration'

const log = createLogger('xo:xo-mixins:backups-ng')

export type Mode = 'full' | 'delta'
export type ReportWhen = 'always' | 'failure' | 'never'

type Settings = {|
  concurrency?: number,
  deleteFirst?: boolean,
  copyRetention?: number,
  exportRetention?: number,
  offlineSnapshot?: boolean,
  reportWhen?: ReportWhen,
  snapshotRetention?: number,
  timeout?: number,
  vmTimeout?: number,
|}

type SimpleIdPattern = {|
  id: string | {| __or: string[] |},
|}

export type BackupJob = {|
  ...$Exact<Job>,
  compression?: 'native',
  mode: Mode,
  remotes?: SimpleIdPattern,
  settings: $Dict<Settings>,
  srs?: SimpleIdPattern,
  type: 'backup',
  vms: Pattern,
|}

type MetadataBase = {|
  _filename?: string,
  jobId: string,
  scheduleId: string,
  timestamp: number,
  version: '2.0.0',
  vm: Object,
  vmSnapshot: Object,
|}
type MetadataDelta = {|
  ...MetadataBase,
  mode: 'delta',
  vdis: $PropertyType<DeltaVmExport, 'vdis'>,
  vbds: $PropertyType<DeltaVmExport, 'vbds'>,
  vhds: { [vdiId: string]: string },
  vifs: $PropertyType<DeltaVmExport, 'vifs'>,
|}
type MetadataFull = {|
  ...MetadataBase,
  mode: 'full',
  xva: string,
|}
type Metadata = MetadataDelta | MetadataFull

const compareSnapshotTime = (a: Vm, b: Vm): number =>
  a.snapshot_time < b.snapshot_time ? -1 : 1

const getReplicatedVmDatetime = (vm: Vm) => {
  const {
    'xo:backup:datetime': datetime = vm.name_label.slice(-17, -1),
  } = vm.other_config
  return datetime
}

const compareReplicatedVmDatetime = (a: Vm, b: Vm): number =>
  getReplicatedVmDatetime(a) < getReplicatedVmDatetime(b) ? -1 : 1

const compareTimestamp = (a: Metadata, b: Metadata): number =>
  a.timestamp - b.timestamp

// returns all entries but the last retention-th
const getOldEntries = <T>(retention: number, entries?: T[]): T[] =>
  entries === undefined
    ? []
    : retention > 0
    ? entries.slice(0, -retention)
    : entries

const defaultSettings: Settings = {
  concurrency: 0,
  deleteFirst: false,
  exportRetention: 0,
  offlineSnapshot: false,
  reportWhen: 'failure',
  snapshotRetention: 0,
  timeout: 0,
  vmTimeout: 0,
}
const getSetting = <T, K: $Keys<Settings>>(
  settings: $Dict<Settings>,
  name: K,
  keys: string[],
  defaultValue?: T
): T | $ElementType<Settings, K> => {
  for (let i = 0, n = keys.length; i < n; ++i) {
    const objectSettings = settings[keys[i]]
    if (objectSettings !== undefined) {
      const setting = objectSettings[name]
      if (setting !== undefined) {
        return setting
      }
    }
  }
  if (defaultValue !== undefined) {
    return defaultValue
  }
  return defaultSettings[name]
}

const BACKUP_DIR = 'xo-vm-backups'
const getVmBackupDir = (uuid: string) => `${BACKUP_DIR}/${uuid}`

const isHiddenFile = (filename: string) => filename[0] === '.'
const isMetadataFile = (filename: string) => filename.endsWith('.json')
const isVhd = (filename: string) => filename.endsWith('.vhd')
const isXva = (filename: string) => filename.endsWith('.xva')

const listReplicatedVms = (
  xapi: Xapi,
  scheduleId: string,
  srId: string,
  vmUuid?: string
): Vm[] => {
  const { all } = xapi.objects
  const vms = {}
  for (const key in all) {
    const object = all[key]
    const oc = object.other_config
    if (
      object.$type === 'vm' &&
      !object.is_a_snapshot &&
      !object.is_a_template &&
      'start' in object.blocked_operations &&
      oc['xo:backup:schedule'] === scheduleId &&
      oc['xo:backup:sr'] === srId &&
      (oc['xo:backup:vm'] === vmUuid ||
        // 2018-03-28, JFT: to catch VMs replicated before this fix
        oc['xo:backup:vm'] === undefined)
    ) {
      vms[object.$id] = object
    }
  }

  return values(vms).sort(compareReplicatedVmDatetime)
}

const importers: $Dict<
  (
    handler: RemoteHandler,
    metadataFilename: string,
    metadata: Metadata,
    xapi: Xapi,
    sr: { $id: string },
    taskId: string,
    logger: Logger
  ) => Promise<string>,
  Mode
> = {
  async delta(handler, metadataFilename, metadata, xapi, sr, taskId, logger) {
    metadata = ((metadata: any): MetadataDelta)
    const { vdis, vhds, vm } = metadata

    const streams = {}
    await asyncMap(vdis, async (vdi, id) => {
      streams[`${id}.vhd`] = await createVhdReadStream(
        handler,
        resolveRelativeFromFile(metadataFilename, vhds[id])
      )
    })

    const delta: DeltaVmImport = {
      streams,
      vbds: metadata.vbds,
      vdis,
      version: '1.0.0',
      vifs: metadata.vifs,
      vm: {
        ...vm,
        name_label: `${vm.name_label} (${safeDateFormat(metadata.timestamp)})`,
        tags: [...vm.tags, 'restored from backup'],
      },
    }

    const { vm: newVm } = await wrapTask(
      {
        logger,
        message: 'transfer',
        parentId: taskId,
        result: ({ transferSize, vm: { $id: id } }) => ({
          size: transferSize,
          id,
        }),
      },
      xapi.importDeltaVm(delta, {
        detectBase: false,
        disableStartAfterImport: false,
        srId: sr,
        // TODO: support mapVdisSrs
      })
    )
    return newVm.$id
  },
  async full(handler, metadataFilename, metadata, xapi, sr, taskId, logger) {
    metadata = ((metadata: any): MetadataFull)

    const xva = await handler.createReadStream(
      resolveRelativeFromFile(metadataFilename, metadata.xva),
      {
        checksum: true,
        ignoreMissingChecksum: true, // provide an easy way to opt-out
      }
    )

    const vm = await wrapTask(
      {
        logger,
        message: 'transfer',
        parentId: taskId,
        result: ({ $id: id }) => ({ size: xva.length, id }),
      },
      xapi.importVm(xva, { srId: sr.$id })
    )
    await Promise.all([
      xapi.addTag(vm.$id, 'restored from backup'),
      xapi.editVm(vm.$id, {
        name_label: `${metadata.vm.name_label} (${safeDateFormat(
          metadata.timestamp
        )})`,
      }),
    ])
    return vm.$id
  },
}

const PARSE_UUID_RE = /-/g
const parseUuid = (uuid: string) =>
  Buffer.from(uuid.replace(PARSE_UUID_RE, ''), 'hex')

const parseVmBackupId = (id: string) => {
  const i = id.indexOf('/')
  return {
    metadataFilename: id.slice(i + 1),
    remoteId: id.slice(0, i),
  }
}

const unboxIds = (pattern?: SimpleIdPattern): string[] => {
  if (pattern === undefined) {
    return []
  }
  const { id } = pattern
  return typeof id === 'string' ? [id] : id.__or
}

// similar to Promise.all() but do not gather results
async function waitAll<T>(
  promises: Promise<T>[],
  onRejection: Function
): Promise<void> {
  promises = promises.map(promise => {
    promise = promise.catch(onRejection)
    promise.catch(noop) // prevent unhandled rejection warning
    return promise
  })
  for (const promise of promises) {
    await promise
  }
}

// write a stream to a file using a temporary file
//
// TODO: merge into RemoteHandlerAbstract
const writeStream = async (
  input: Readable | Promise<Readable>,
  handler: RemoteHandler,
  path: string,
  { checksum = true }: { checksum?: boolean } = {}
): Promise<void> => {
  input = await input
  const tmpPath = `${dirname(path)}/.${basename(path)}`
  const output = await handler.createOutputStream(tmpPath, { checksum })
  try {
    input.pipe(output)
    await pFromEvent(output, 'finish')
    await output.checksumWritten
    // $FlowFixMe
    await input.task
    await handler.rename(tmpPath, path, { checksum })
  } catch (error) {
    await handler.unlink(tmpPath, { checksum })
    throw error
  }
}

const wrapTask = async <T>(opts: any, task: Promise<T>): Promise<T> => {
  const { data, logger, message, parentId, result } = opts

  const taskId = logger.notice(message, {
    event: 'task.start',
    parentId,
    data,
  })

  return task.then(
    value => {
      logger.notice(message, {
        event: 'task.end',
        result: typeof result === 'function' ? result(value) : result,
        status: 'success',
        taskId,
      })
      return task
    },
    result => {
      logger.error(message, {
        event: 'task.end',
        result: serializeError(result),
        status: 'failure',
        taskId,
      })
      return task
    }
  )
}

const wrapTaskFn = <T>(
  opts: any,
  task: (...any) => Promise<T>
): ((taskId: string, ...any) => Promise<T>) =>
  async function() {
    const { data, logger, message, parentId, result } =
      typeof opts === 'function' ? opts.apply(this, arguments) : opts

    const taskId = logger.notice(message, {
      event: 'task.start',
      parentId,
      data,
    })

    try {
      const value = await task.apply(this, [taskId, ...arguments])
      logger.notice(message, {
        event: 'task.end',
        result: typeof result === 'function' ? result(value) : result,
        status: 'success',
        taskId,
      })
      return value
    } catch (result) {
      logger.error(message, {
        event: 'task.end',
        result: serializeError(result),
        status: 'failure',
        taskId,
      })
      throw result
    }
  }

const extractIdsFromSimplePattern = (pattern: mixed) => {
  if (pattern === null || typeof pattern !== 'object') {
    return
  }

  let keys = Object.keys(pattern)
  if (keys.length !== 1 || keys[0] !== 'id') {
    return
  }

  pattern = pattern.id
  if (typeof pattern === 'string') {
    return [pattern]
  }
  if (pattern === null || typeof pattern !== 'object') {
    return
  }

  keys = Object.keys(pattern)
  if (
    keys.length === 1 &&
    keys[0] === '__or' &&
    Array.isArray((pattern = pattern.__or)) &&
    pattern.every(_ => typeof _ === 'string')
  ) {
    return pattern
  }
}

const disableVmHighAvailability = async (xapi: Xapi, vm: Vm) => {
  if (vm.ha_restart_priority === '') {
    return
  }

  return Promise.all([
    xapi._setObjectProperties(vm, {
      haRestartPriority: '',
    }),
    xapi.addTag(vm.$ref, 'HA disabled'),
  ])
}

// File structure on remotes:
//
// <remote>
// └─ xo-vm-backups
//   ├─ index.json // TODO
//   └─ <VM UUID>
//      ├─ index.json // TODO
//      ├─ vdis
//      │  └─ <job UUID>
//      │     └─ <VDI UUID>
//      │        ├─ index.json // TODO
//      │        └─ <YYYYMMDD>T<HHmmss>.vhd
//      ├─ <YYYYMMDD>T<HHmmss>.json // backup metadata
//      ├─ <YYYYMMDD>T<HHmmss>.xva
//      └─ <YYYYMMDD>T<HHmmss>.xva.checksum
//
// Attributes of created VMs:
//
// - name: `${original name} - ${job name} - (${safeDateFormat(backup timestamp)})`
// - tag:
//    - copy in delta mode: `Continuous Replication`
//    - copy in full mode: `Disaster Recovery`
//    - imported from backup: `restored from backup`
//
// Task logs emitted in a backup execution:
//
// job.start(data: { mode: Mode, reportWhen: ReportWhen })
// ├─ task.info(message: 'vms', data: { vms: string[] })
// ├─ task.warning(message: 'missingVms', data: { vms: string[] })
// ├─ task.warning(message: string)
// ├─ task.start(data: { type: 'VM', id: string })
// │  ├─ task.warning(message: string)
// │  ├─ task.start(message: 'snapshot')
// │  │  └─ task.end
// │  ├─ task.start(message: 'export', data: { type: 'SR' | 'remote', id: string })
// │  │  ├─ task.warning(message: string)
// │  │  ├─ task.start(message: 'transfer')
// │  │  │  ├─ task.warning(message: string)
// │  │  │  └─ task.end(result: { size: number })
// │  │  ├─ task.start(message: 'merge')
// │  │  │  ├─ task.warning(message: string)
// │  │  │  └─ task.end(result: { size: number })
// │  │  └─ task.end
// │  └─ task.end
// └─ job.end
export default class BackupNg {
  _app: {
    createJob: ($Diff<BackupJob, {| id: string |}>) => Promise<BackupJob>,
    createSchedule: ($Diff<Schedule, {| id: string |}>) => Promise<Schedule>,
    deleteSchedule: (id: string) => Promise<void>,
    getAllSchedules: () => Promise<Schedule[]>,
    getRemoteHandler: (id: string) => Promise<RemoteHandler>,
    getXapi: (id: string) => Xapi,
    getJob: ((id: string, 'backup') => Promise<BackupJob>) &
      ((id: string, 'call') => Promise<CallJob>),
    getLogs: (namespace: string) => Promise<{ [id: string]: Object }>,
    updateJob: (($Shape<BackupJob>, ?boolean) => Promise<BackupJob>) &
      (($Shape<CallJob>, ?boolean) => Promise<CallJob>),
    removeJob: (id: string) => Promise<void>,
    worker: $Dict<any>,
  }
  _logger: Logger
  _runningRestores: Set<string>

  get runningRestores() {
    return this._runningRestores
  }

  constructor(app: any) {
    this._app = app
    this._logger = undefined
    this._runningRestores = new Set()

    app.on('start', async () => {
      this._logger = await app.getLogger('restore')

      const executor: Executor = async ({
        cancelToken,
        data: vmsId,
        job: job_,
        logger,
        runJobId,
        schedule,
      }) => {
        if (schedule === undefined) {
          throw new Error('backup job cannot run without a schedule')
        }

        const job: BackupJob = (job_: any)
        const vmsPattern = job.vms

        let vms: $Dict<Vm>
        if (
          vmsId !== undefined ||
          (vmsId = extractIdsFromSimplePattern(vmsPattern)) !== undefined
        ) {
          vms = {}
          const missingVms = []
          vmsId.forEach(id => {
            try {
              vms[id] = app.getObject(id, 'VM')
            } catch (error) {
              missingVms.push(id)
            }
          })

          if (missingVms.length !== 0) {
            logger.warning('missingVms', {
              event: 'task.warning',
              taskId: runJobId,
              data: {
                vms: missingVms,
              },
            })
          }
        } else {
          vms = app.getObjects({
            filter: createPredicate({
              type: 'VM',
              ...vmsPattern,
            }),
          })
          if (isEmpty(vms)) {
            throw new Error('no VMs match this pattern')
          }
        }
        const jobId = job.id
        const srs = unboxIds(job.srs).map(id => {
          const xapi = app.getXapi(id)
          return {
            __proto__: xapi.getObject(id),
            xapi,
          }
        })
        const remotes = await Promise.all(
          unboxIds(job.remotes).map(async id => ({
            id,
            handler: await app.getRemoteHandler(id),
          }))
        )

        const timeout = getSetting(job.settings, 'timeout', [''])
        if (timeout !== 0) {
          const source = CancelToken.source([cancelToken])
          cancelToken = source.token
          setTimeout(source.cancel, timeout)
        }

        let handleVm = async vm => {
          const { name_label: name, uuid } = vm
          const taskId: string = logger.notice(
            `Starting backup of ${name}. (${jobId})`,
            {
              event: 'task.start',
              parentId: runJobId,
              data: {
                type: 'VM',
                id: uuid,
              },
            }
          )
          let vmCancel
          try {
            cancelToken.throwIfRequested()
            vmCancel = CancelToken.source([cancelToken])

            // $FlowFixMe injected $defer param
            const p = this._backupVm(
              vmCancel.token,
              uuid,
              job,
              schedule,
              logger,
              taskId,
              srs,
              remotes
            )

            // 2018-07-20, JFT: vmTimeout is disabled for the time being until
            // we figure out exactly how it should behave.
            //
            // const vmTimeout: number = getSetting(job.settings, 'vmTimeout', [
            //   uuid,
            //   scheduleId,
            // ])
            // if (vmTimeout !== 0) {
            //   p = pTimeout.call(p, vmTimeout)
            // }

            await p
            logger.notice(`Backuping ${name} is a success. (${jobId})`, {
              event: 'task.end',
              taskId,
              status: 'success',
            })
          } catch (error) {
            if (vmCancel !== undefined) {
              vmCancel.cancel()
            }
            logger.error(`Backuping ${name} has failed. (${jobId})`, {
              event: 'task.end',
              taskId,
              status: 'failure',
              result: Array.isArray(error)
                ? error.map(serializeError)
                : serializeError(error),
            })
          }
        }

        const concurrency: number = getSetting(job.settings, 'concurrency', [
          '',
        ])
        if (concurrency !== 0) {
          handleVm = limitConcurrency(concurrency)(handleVm)
          logger.notice('vms', {
            event: 'task.info',
            taskId: runJobId,
            data: {
              vms: Object.keys(vms),
            },
          })
        }
        await asyncMap(vms, handleVm)
      }
      app.registerJobExecutor('backup', executor)
    })
  }

  async createBackupNgJob(
    props: $Diff<BackupJob, {| id: string |}>,
    schedules?: $Dict<$Diff<Schedule, {| id: string |}>>
  ): Promise<BackupJob> {
    const app = this._app
    props.type = 'backup'
    const job: BackupJob = await app.createJob(props)

    if (schedules !== undefined) {
      const { id, settings } = job
      const tmpIds = Object.keys(schedules)
      await asyncMap(tmpIds, async (tmpId: string) => {
        // $FlowFixMe don't know what is the problem (JFT)
        const schedule = schedules[tmpId]
        schedule.jobId = id
        settings[(await app.createSchedule(schedule)).id] = settings[tmpId]
        delete settings[tmpId]
      })
      await app.updateJob({ id, settings })
    }

    return job
  }

  async deleteBackupNgJob(id: string): Promise<void> {
    const app = this._app
    const [schedules] = await Promise.all([
      app.getAllSchedules(),
      app.getJob(id, 'backup'),
    ])
    await Promise.all([
      app.removeJob(id),
      asyncMap(schedules, schedule => {
        if (schedule.id === id) {
          app.deleteSchedule(schedule.id)
        }
      }),
    ])
  }

  async deleteVmBackupNg(id: string): Promise<void> {
    const app = this._app
    const { metadataFilename, remoteId } = parseVmBackupId(id)
    const handler = await app.getRemoteHandler(remoteId)
    const metadata: Metadata = JSON.parse(
      String(await handler.readFile(metadataFilename))
    )
    metadata._filename = metadataFilename

    if (metadata.mode === 'delta') {
      await this._deleteDeltaVmBackups(handler, [metadata])
    } else if (metadata.mode === 'full') {
      await this._deleteFullVmBackups(handler, [metadata])
    } else {
      throw new Error(`no deleter for backup mode ${metadata.mode}`)
    }
  }

  // Task logs emitted in a restore execution:
  //
  // task.start(message: 'restore', data: { jobId: string, srId: string, time: number })
  // ├─ task.start(message: 'transfer')
  // │  └─ task.end(result: { id: string, size: number })
  // └─ task.end
  async importVmBackupNg(id: string, srId: string): Promise<string> {
    const app = this._app
    const { metadataFilename, remoteId } = parseVmBackupId(id)
    const handler = await app.getRemoteHandler(remoteId)
    const metadata: Metadata = JSON.parse(
      String(await handler.readFile(metadataFilename))
    )

    const importer = importers[metadata.mode]
    if (importer === undefined) {
      throw new Error(`no importer for backup mode ${metadata.mode}`)
    }

    const xapi = app.getXapi(srId)
    const { jobId, timestamp: time } = metadata
    const logger = this._logger
    return wrapTaskFn(
      {
        data: {
          jobId,
          srId,
          time,
        },
        logger,
        message: 'restore',
      },
      taskId => {
        this._runningRestores.add(taskId)
        return importer(
          handler,
          metadataFilename,
          metadata,
          xapi,
          xapi.getObject(srId),
          taskId,
          logger
        )::pFinally(() => {
          this._runningRestores.delete(taskId)
        })
      }
    )()
  }

  async listVmBackupsNg(remotes: string[]) {
    const backupsByVmByRemote: $Dict<$Dict<Metadata[]>> = {}

    const app = this._app
    await Promise.all(
      remotes.map(async remoteId => {
        try {
          const handler = await app.getRemoteHandler(remoteId)

          const entries = (await handler.list(BACKUP_DIR).catch(error => {
            if (error == null || error.code !== 'ENOENT') {
              throw error
            }
            return []
          })).filter(name => name !== 'index.json')

          const backupsByVm = (backupsByVmByRemote[remoteId] = {})
          await Promise.all(
            entries.map(async vmUuid => {
              // $FlowFixMe don't know what is the problem (JFT)
              const backups = await this._listVmBackups(handler, vmUuid)

              if (backups.length === 0) {
                return
              }

              // inject an id usable by importVmBackupNg()
              backups.forEach(backup => {
                backup.id = `${remoteId}/${backup._filename}`

                const { vdis, vhds } = backup
                backup.disks =
                  vhds === undefined
                    ? []
                    : Object.keys(vhds).map(vdiId => {
                        const vdi = vdis[vdiId]
                        return {
                          id: `${dirname(backup._filename)}/${vhds[vdiId]}`,
                          name: vdi.name_label,
                          uuid: vdi.uuid,
                        }
                      })
              })

              backupsByVm[vmUuid] = backups
            })
          )
        } catch (error) {
          log.warn(`listVmBackups for remote ${remoteId}:`, { error })
        }
      })
    )

    return backupsByVmByRemote
  }

  async migrateLegacyBackupJob(jobId: string) {
    const [job, schedules] = await Promise.all([
      this._app.getJob(jobId, 'call'),
      this._app.getAllSchedules(),
    ])
    await this._app.updateJob(translateLegacyJob(job, schedules), false)
  }

  // High:
  // - [ ] in case of merge failure
  //       1. delete (or isolate) the tainted VHD
  //       2. next run should be a full
  // - [ ] add a lock on the job/VDI during merge which should prevent other merges and restoration
  // - [ ] in case of failure, correctly clean VHDs for all VDIs
  //
  // Low:
  // - [ ] display queued VMs
  // - [ ] snapshots and files of an old job should be detected and removed
  // - [ ] delta import should support mapVdisSrs
  // - [ ] size of the path? (base64url(parseUuid(uuid)))
  // - [ ] what does mean the vmTimeout with the new concurrency? a VM can take
  //       a very long time to finish if there are other VMs before…
  // - [ ] detect and gc uncomplete replications
  // - [ ] attach VDIs ASAP to be able to clean them in case of interruption
  // - [ ] orphan VDIs on the source side
  //
  // Triage:
  // - [ ] logs
  //
  // Done:
  //
  // - [x] files (.tmp) should be renamed at the end of job
  // - [x] detect full remote
  // - [x] can the snapshot and export retention be different? → Yes
  // - [x] deleteFirst per target
  // - [x] timeout per VM
  // - [x] backups should be deletable from the API
  // - [x] adding and removing VDIs should behave
  // - [x] isolate VHD chains by job
  // - [x] do not delete rolling snapshot in case of failure!
  // - [x] do not create snapshot if unhealthy vdi chain
  // - [x] replicated VMs should be discriminated by VM (vatesfr/xen-orchestra#2807)
  // - [x] clones of replicated VMs should not be garbage collected
  // - [x] import for delta
  // - [x] fix backup reports
  // - [x] jobs should be cancelable
  // - [x] possibility to (re-)run a single VM in a backup?
  // - [x] validate VHDs after exports and before imports, how?
  // - [x] check merge/transfert duration/size are what we want for delta
  @defer
  async _backupVm(
    $defer: any,
    $cancelToken: any,
    vmUuid: string,
    job: BackupJob,
    schedule: Schedule,
    logger: any,
    taskId: string,
    srs: any[],
    remotes: any[]
  ): Promise<void> {
    const app = this._app
    const xapi = app.getXapi(vmUuid)
    const vm: Vm = (xapi.getObject(vmUuid): any)

    // ensure the VM itself does not have any backup metadata which would be
    // copied on manual snapshots and interfere with the backup jobs
    if ('xo:backup:job' in vm.other_config) {
      await wrapTask(
        {
          logger,
          message: 'clean backup metadata on VM',
          parentId: taskId,
        },
        xapi._updateObjectMapProperty(vm, 'other_config', {
          'xo:backup:datetime': null,
          'xo:backup:exported': null,
          'xo:backup:job': null,
          'xo:backup:schedule': null,
          'xo:backup:vm': null,
        })
      )
    }

    const { id: jobId, mode, settings } = job
    const { id: scheduleId } = schedule

    let exportRetention: number = getSetting(settings, 'exportRetention', [
      scheduleId,
    ])
    let copyRetention: number | void = getSetting(settings, 'copyRetention', [
      scheduleId,
    ])

    if (copyRetention === undefined) {
      // if copyRetention is not defined, it uses exportRetention's value due to
      // previous implementation which did not support copyRetention
      copyRetention = srs.length === 0 ? 0 : exportRetention

      if (remotes.length === 0) {
        exportRetention = 0
      }
    } else if (exportRetention !== 0 && remotes.length === 0) {
      throw new Error('export retention must be 0 without remotes')
    }

    if (copyRetention !== 0 && srs.length === 0) {
      throw new Error('copy retention must be 0 without SRs')
    }

    if (
      remotes.length !== 0 &&
      srs.length !== 0 &&
      (copyRetention === 0) !== (exportRetention === 0)
    ) {
      throw new Error('both or neither copy and export retentions must be 0')
    }

    const snapshotRetention: number = getSetting(
      settings,
      'snapshotRetention',
      [scheduleId]
    )

    if (
      copyRetention === 0 &&
      exportRetention === 0 &&
      snapshotRetention === 0
    ) {
      throw new Error('copy, export and snapshot retentions cannot both be 0')
    }

    if (
      !some(
        vm.$VBDs,
        vbd => vbd.type === 'Disk' && vbd.VDI !== 'OpaqueRef:NULL'
      )
    ) {
      throw new Error('no disks found')
    }

    const snapshots = vm.$snapshots
      .filter(_ => _.other_config['xo:backup:job'] === jobId)
      .sort(compareSnapshotTime)

    xapi._assertHealthyVdiChains(vm)

    const offlineSnapshot: boolean = getSetting(settings, 'offlineSnapshot', [
      vmUuid,
      '',
    ])
    const startAfterSnapshot = offlineSnapshot && vm.power_state === 'Running'
    if (startAfterSnapshot) {
      await wrapTask(
        {
          logger,
          message: 'shutdown VM',
          parentId: taskId,
        },
        xapi.shutdownVm(vm)
      )
    }

    let snapshot: Vm = (await wrapTask(
      {
        logger,
        message: 'snapshot',
        parentId: taskId,
        result: _ => _.uuid,
      },
      xapi._snapshotVm(
        $cancelToken,
        vm,
        `[XO Backup ${job.name}] ${vm.name_label}`
      )
    ): any)

    if (startAfterSnapshot) {
      ignoreErrors.call(xapi.startVm(vm))
    }

    await wrapTask(
      {
        logger,
        message: 'add metadata to snapshot',
        parentId: taskId,
      },
      xapi._updateObjectMapProperty(snapshot, 'other_config', {
        'xo:backup:datetime': snapshot.snapshot_time,
        'xo:backup:job': jobId,
        'xo:backup:schedule': scheduleId,
        'xo:backup:vm': vmUuid,
      })
    )

    snapshot = await xapi.barrier(snapshot.$ref)

    let baseSnapshot
    if (mode === 'delta') {
      baseSnapshot = findLast(
        snapshots,
        _ => 'xo:backup:exported' in _.other_config
      )

      // JFT 2018-10-02: support previous snapshots which did not have this
      // entry, can be removed after 2018-12.
      if (baseSnapshot === undefined) {
        baseSnapshot = last(snapshots)
      }
    }
    snapshots.push(snapshot)

    // snapshots to delete due to the snapshot retention settings
    const snapshotsToDelete = flatMap(
      groupBy(snapshots, _ => _.other_config['xo:backup:schedule']),
      (snapshots, scheduleId) =>
        getOldEntries(
          getSetting(settings, 'snapshotRetention', [scheduleId]),
          snapshots
        )
    )

    // delete unused snapshots
    await asyncMap(snapshotsToDelete, vm => {
      // snapshot and baseSnapshot should not be deleted right now
      if (vm !== snapshot && vm !== baseSnapshot) {
        return xapi.deleteVm(vm)
      }
    })

    snapshot = ((await wrapTask(
      {
        logger,
        message: 'waiting for uptodate snapshot record',
        parentId: taskId,
      },
      xapi.barrier(snapshot.$ref)
    ): any): Vm)

    if (copyRetention === 0 && exportRetention === 0) {
      return
    }

    const nTargets = remotes.length + srs.length

    const now = Date.now()
    const vmDir = getVmBackupDir(vmUuid)

    const basename = safeDateFormat(now)

    const metadataFilename = `${vmDir}/${basename}.json`

    if (mode === 'full') {
      // TODO: do not create the snapshot if there are no snapshotRetention and
      // the VM is not running
      if (snapshotsToDelete.includes(snapshot)) {
        $defer.call(xapi, 'deleteVm', snapshot)
      }

      let xva: any = await wrapTask(
        {
          logger,
          message: 'start snapshot export',
          parentId: taskId,
        },
        xapi.exportVm($cancelToken, snapshot, {
          compress: job.compression === 'native',
        })
      )
      const exportTask = xva.task
      xva = xva.pipe(createSizeStream())

      const forkExport =
        nTargets === 1
          ? () => xva
          : () => {
              const fork = xva.pipe(new PassThrough())
              fork.task = exportTask
              return fork
            }

      const dataBasename = `${basename}.xva`

      const metadata: MetadataFull = {
        jobId,
        mode: 'full',
        scheduleId,
        timestamp: now,
        version: '2.0.0',
        vm,
        vmSnapshot: snapshot,
        xva: `./${dataBasename}`,
      }
      const dataFilename = `${vmDir}/${dataBasename}`

      const jsonMetadata = JSON.stringify(metadata)

      await waitAll(
        [
          ...remotes.map(
            wrapTaskFn(
              ({ id }) => ({
                data: { id, type: 'remote' },
                logger,
                message: 'export',
                parentId: taskId,
              }),
              async (taskId, { handler, id: remoteId }) => {
                const fork = forkExport()

                // remove incomplete XVAs
                await asyncMap(
                  handler.list(vmDir, {
                    filter: filename =>
                      isHiddenFile(filename) && isXva(filename),
                    prependDir: true,
                  }),
                  file => handler.unlink(file)
                )::ignoreErrors()

                const oldBackups: MetadataFull[] = (getOldEntries(
                  exportRetention - 1,
                  await this._listVmBackups(
                    handler,
                    vm,
                    _ => _.mode === 'full' && _.scheduleId === scheduleId
                  )
                ): any)

                const deleteFirst = getSetting(settings, 'deleteFirst', [
                  remoteId,
                ])
                if (deleteFirst) {
                  await this._deleteFullVmBackups(handler, oldBackups)
                }

                await wrapTask(
                  {
                    logger,
                    message: 'transfer',
                    parentId: taskId,
                    result: () => ({ size: xva.size }),
                  },
                  writeStream(fork, handler, dataFilename)
                )

                await handler.outputFile(metadataFilename, jsonMetadata)

                if (!deleteFirst) {
                  await this._deleteFullVmBackups(handler, oldBackups)
                }
              }
            )
          ),
          ...srs.map(
            wrapTaskFn(
              ({ $id: id }) => ({
                data: { id, type: 'SR' },
                logger,
                message: 'export',
                parentId: taskId,
              }),
              async (taskId, sr) => {
                const fork = forkExport()

                const { $id: srId, xapi } = sr

                const oldVms = getOldEntries(
                  copyRetention - 1,
                  listReplicatedVms(xapi, scheduleId, srId, vmUuid)
                )

                const deleteFirst = getSetting(settings, 'deleteFirst', [srId])
                if (deleteFirst) {
                  await this._deleteVms(xapi, oldVms)
                }

                const vm = await xapi.barrier(
                  await wrapTask(
                    {
                      logger,
                      message: 'transfer',
                      parentId: taskId,
                      result: () => ({ size: xva.size }),
                    },
                    xapi._importVm($cancelToken, fork, sr, vm =>
                      xapi._setObjectProperties(vm, {
                        nameLabel: `${metadata.vm.name_label} - ${
                          job.name
                        } - (${safeDateFormat(metadata.timestamp)})`,
                      })
                    )
                  )
                )

                await Promise.all([
                  xapi.addTag(vm.$ref, 'Disaster Recovery'),
                  disableVmHighAvailability(xapi, vm),
                  xapi._updateObjectMapProperty(vm, 'blocked_operations', {
                    start:
                      'Start operation for this vm is blocked, clone it if you want to use it.',
                  }),
                  xapi._updateObjectMapProperty(vm, 'other_config', {
                    'xo:backup:sr': srId,
                  }),
                ])

                if (!deleteFirst) {
                  await this._deleteVms(xapi, oldVms)
                }
              }
            )
          ),
        ],
        noop // errors are handled in logs
      )
    } else if (mode === 'delta') {
      if (snapshotsToDelete.includes(snapshot)) {
        $defer.onFailure.call(xapi, 'deleteVm', snapshot)
      }
      if (snapshotsToDelete.includes(baseSnapshot)) {
        $defer.onSuccess.call(xapi, 'deleteVm', baseSnapshot)
      }

      let fullVdisRequired
      await (async () => {
        if (baseSnapshot === undefined) {
          return
        }

        const fullRequired = { __proto__: null }
        const vdis: $Dict<Vdi> = getVmDisks(baseSnapshot)

        // ignore VDI snapshots which no longer have a parent
        forOwn(vdis, (vdi, key, vdis) => {
          // `vdi.snapshot_of` is not always set to the null ref, it can contain
          // an invalid ref, that's why the test is on `vdi.$snapshot_of`
          if (vdi.$snapshot_of === undefined) {
            delete vdis[key]
          }
        })

        for (const { $id: srId, xapi } of srs) {
          const replicatedVm = listReplicatedVms(
            xapi,
            scheduleId,
            srId,
            vmUuid
          ).find(vm => vm.other_config[TAG_COPY_SRC] === baseSnapshot.uuid)
          if (replicatedVm === undefined) {
            baseSnapshot = undefined
            return
          }

          const replicatedVdis = countBy(
            getVmDisks(replicatedVm),
            vdi => vdi.other_config[TAG_COPY_SRC]
          )
          forOwn(vdis, vdi => {
            if (!(vdi.uuid in replicatedVdis)) {
              fullRequired[vdi.$snapshot_of.$id] = true
            }
          })
        }

        await asyncMap(remotes, ({ handler }) => {
          return asyncMap(vdis, async vdi => {
            const snapshotOf = vdi.$snapshot_of
            const dir = `${vmDir}/vdis/${jobId}/${snapshotOf.uuid}`
            const files = await handler
              .list(dir, { filter: isVhd })
              .catch(_ => [])
            let full = true
            await asyncMap(files, async file => {
              if (file[0] !== '.') {
                try {
                  const path = `${dir}/${file}`
                  const vhd = new Vhd(handler, path)
                  await vhd.readHeaderAndFooter()

                  if (vhd.footer.uuid.equals(parseUuid(vdi.uuid))) {
                    await checkVhdChain(handler, path)
                    full = false
                  }

                  return
                } catch (error) {
                  if (!(error instanceof AssertionError)) {
                    throw error
                  }
                }
              }

              // either a temporary file or an invalid VHD
              await handler.unlink(`${dir}/${file}`)
            })
            if (full) {
              fullRequired[snapshotOf.$id] = true
            }
          })
        })
        fullVdisRequired = Object.keys(fullRequired)
      })()

      const deltaExport = await wrapTask(
        {
          logger,
          message: 'start snapshot export',
          parentId: taskId,
        },
        xapi.exportDeltaVm($cancelToken, snapshot, baseSnapshot, {
          fullVdisRequired,
        })
      )

      const metadata: MetadataDelta = {
        jobId,
        mode: 'delta',
        scheduleId,
        timestamp: now,
        vbds: deltaExport.vbds,
        vdis: deltaExport.vdis,
        version: '2.0.0',
        vifs: deltaExport.vifs,
        vhds: mapValues(
          deltaExport.vdis,
          vdi =>
            `vdis/${jobId}/${
              (xapi.getObject(vdi.snapshot_of): Object).uuid
            }/${basename}.vhd`
        ),
        vm,
        vmSnapshot: snapshot,
      }

      const jsonMetadata = JSON.stringify(metadata)

      // create a fork of the delta export
      const forkExport =
        nTargets === 1
          ? () => deltaExport
          : (() => {
              // replace the stream factories by fork factories
              const streams: any = mapValues(
                deltaExport.streams,
                lazyStream => {
                  // wait for all targets to require the stream and then starts
                  // the real export and create the forks.
                  const resolves = []
                  function resolver(resolve) {
                    resolves.push(resolve)

                    if (resolves.length === nTargets) {
                      const pStream = lazyStream()
                      resolves.forEach(resolve => {
                        resolve(
                          pStream.then(stream => {
                            const fork: any = stream.pipe(new PassThrough())
                            fork.task = stream.task
                            return fork
                          })
                        )
                      })
                      resolves.length = 0
                    }
                  }

                  return () => new Promise(resolver)
                }
              )
              return () => {
                return {
                  __proto__: deltaExport,
                  streams,
                }
              }
            })()

      const isFull = some(
        deltaExport.vdis,
        vdi => vdi.other_config['xo:base_delta'] === undefined
      )
      await waitAll(
        [
          ...remotes.map(
            wrapTaskFn(
              ({ id }) => ({
                data: { id, isFull, type: 'remote' },
                logger,
                message: 'export',
                parentId: taskId,
              }),
              async (taskId, { handler, id: remoteId }) => {
                const fork = forkExport()

                const oldBackups: MetadataDelta[] = (getOldEntries(
                  exportRetention - 1,
                  await this._listVmBackups(
                    handler,
                    vm,
                    _ => _.mode === 'delta' && _.scheduleId === scheduleId
                  )
                ): any)
                const deleteOldBackups = () =>
                  wrapTask(
                    {
                      logger,
                      message: 'merge',
                      parentId: taskId,
                      result: size => ({ size }),
                    },
                    this._deleteDeltaVmBackups(handler, oldBackups)
                  )

                const deleteFirst =
                  exportRetention > 1 &&
                  getSetting(settings, 'deleteFirst', [remoteId])
                if (deleteFirst) {
                  await deleteOldBackups()
                }

                await wrapTask(
                  {
                    logger,
                    message: 'transfer',
                    parentId: taskId,
                    result: size => ({ size }),
                  },
                  asyncMap(
                    fork.vdis,
                    defer(async ($defer, vdi, id) => {
                      const path = `${vmDir}/${metadata.vhds[id]}`

                      const isDelta =
                        vdi.other_config['xo:base_delta'] !== undefined
                      let parentPath
                      if (isDelta) {
                        const vdiDir = dirname(path)
                        parentPath = (await handler.list(vdiDir, {
                          filter: filename =>
                            !isHiddenFile(filename) && isVhd(filename),
                          prependDir: true,
                        }))
                          .sort()
                          .pop()
                          .slice(1) // remove leading slash

                        // ensure parent exists and is a valid VHD
                        await new Vhd(handler, parentPath).readHeaderAndFooter()
                      }

                      // FIXME: should only be renamed after the metadata file has been written
                      await writeStream(
                        fork.streams[`${id}.vhd`](),
                        handler,
                        path,
                        {
                          // no checksum for VHDs, because they will be invalidated by
                          // merges and chainings
                          checksum: false,
                        }
                      )
                      $defer.onFailure.call(handler, 'unlink', path)

                      if (isDelta) {
                        await chainVhd(handler, parentPath, handler, path)
                      }

                      // set the correct UUID in the VHD
                      const vhd = new Vhd(handler, path)
                      await vhd.readHeaderAndFooter()
                      vhd.footer.uuid = parseUuid(vdi.uuid)
                      await vhd.readBlockAllocationTable() // required by writeFooter()
                      await vhd.writeFooter()

                      return handler.getSize(path)
                    })
                  ).then(sum)
                )
                await handler.outputFile(metadataFilename, jsonMetadata)

                if (!deleteFirst) {
                  await deleteOldBackups()
                }
              }
            )
          ),
          ...srs.map(
            wrapTaskFn(
              ({ $id: id }) => ({
                data: { id, isFull, type: 'SR' },
                logger,
                message: 'export',
                parentId: taskId,
              }),
              async (taskId, sr) => {
                const fork = forkExport()

                const { $id: srId, xapi } = sr

                const oldVms = getOldEntries(
                  copyRetention - 1,
                  listReplicatedVms(xapi, scheduleId, srId, vmUuid)
                )

                const deleteFirst = getSetting(settings, 'deleteFirst', [srId])
                if (deleteFirst) {
                  await this._deleteVms(xapi, oldVms)
                }

                const { vm } = await wrapTask(
                  {
                    logger,
                    message: 'transfer',
                    parentId: taskId,
                    result: ({ transferSize }) => ({ size: transferSize }),
                  },
                  xapi.importDeltaVm(fork, {
                    disableStartAfterImport: false, // we'll take care of that
                    name_label: `${metadata.vm.name_label} - ${
                      job.name
                    } - (${safeDateFormat(metadata.timestamp)})`,
                    srId,
                  })
                )

                await Promise.all([
                  xapi.addTag(vm.$ref, 'Continuous Replication'),
                  disableVmHighAvailability(xapi, vm),
                  xapi._updateObjectMapProperty(vm, 'blocked_operations', {
                    start:
                      'Start operation for this vm is blocked, clone it if you want to use it.',
                  }),
                  xapi._updateObjectMapProperty(vm, 'other_config', {
                    'xo:backup:sr': srId,
                  }),
                ])

                if (!deleteFirst) {
                  await this._deleteVms(xapi, oldVms)
                }
              }
            )
          ),
        ],
        noop // errors are handled in logs
      )
    } else {
      throw new Error(`no exporter for backup mode ${mode}`)
    }

    await wrapTask(
      {
        logger,
        message: 'set snapshot.other_config[xo:backup:exported]',
        parentId: taskId,
      },
      xapi._updateObjectMapProperty(snapshot, 'other_config', {
        'xo:backup:exported': 'true',
      })
    )
  }

  async _deleteDeltaVmBackups(
    handler: RemoteHandler,
    backups: MetadataDelta[]
  ): Promise<number> {
    return asyncMap(backups, async backup => {
      const filename = ((backup._filename: any): string)

      await handler.unlink(filename)

      return asyncMap(backup.vhds, _ =>
        // $FlowFixMe injected $defer param
        this._deleteVhd(handler, resolveRelativeFromFile(filename, _))
      ).then(sum)
    }).then(sum)
  }

  async _deleteFullVmBackups(
    handler: RemoteHandler,
    backups: MetadataFull[]
  ): Promise<void> {
    await asyncMap(backups, ({ _filename, xva }) => {
      _filename = ((_filename: any): string)
      return Promise.all([
        handler.unlink(_filename),
        handler.unlink(resolveRelativeFromFile(_filename, xva)),
      ])
    })
  }

  // FIXME: synchronize by job/VDI, otherwise it can cause issues with the merge
  @defer
  async _deleteVhd(
    $defer: any,
    handler: RemoteHandler,
    path: string
  ): Promise<number> {
    const vhds = await asyncMap(
      await handler.list(dirname(path), { filter: isVhd, prependDir: true }),
      async path => {
        try {
          const vhd = new Vhd(handler, path)
          await vhd.readHeaderAndFooter()
          return {
            footer: vhd.footer,
            header: vhd.header,
            path,
          }
        } catch (error) {
          // Do not fail on corrupted VHDs (usually uncleaned temporary files),
          // they are probably inconsequent to the backup process and should not
          // fail it.
          log.warn(`BackupNg#_deleteVhd ${path}`, { error })
        }
      }
    )
    const base = basename(path)
    const child = vhds.find(
      _ => _ !== undefined && _.header.parentUnicodeName === base
    )
    if (child === undefined) {
      await handler.unlink(path)
      return 0
    }

    $defer.onFailure.call(handler, 'unlink', path)

    const childPath = child.path
    const mergedDataSize: number = await this._app.worker.mergeVhd(
      handler._remote,
      path,
      handler._remote,
      childPath
    )
    await handler.rename(path, childPath)
    return mergedDataSize
  }

  async _deleteVms(xapi: Xapi, vms: Vm[]): Promise<void> {
    await asyncMap(vms, vm => xapi.deleteVm(vm))
  }

  async _listVmBackups(
    handler: RemoteHandler,
    vm: Object | string,
    predicate?: Metadata => boolean
  ): Promise<Metadata[]> {
    const backups = []

    const dir = getVmBackupDir(typeof vm === 'string' ? vm : vm.uuid)
    try {
      const files = await handler.list(dir)
      await Promise.all(
        files.filter(isMetadataFile).map(async file => {
          const path = `${dir}/${file}`
          try {
            const metadata = JSON.parse(String(await handler.readFile(path)))
            if (predicate === undefined || predicate(metadata)) {
              Object.defineProperty(metadata, '_filename', {
                value: path,
              })
              backups.push(metadata)
            }
          } catch (error) {
            log.warn(`_listVmBackups ${path}`, { error })
          }
        })
      )
    } catch (error) {
      let code
      if (
        error == null ||
        ((code = error.code) !== 'ENOENT' && code !== 'ENOTDIR')
      ) {
        throw error
      }
    }

    return backups.sort(compareTimestamp)
  }
}
