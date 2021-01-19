import assert from 'assert'
import defer from 'golike-defer'
import Disposable from 'promise-toolbox/Disposable'
import fromCallback from 'promise-toolbox/fromCallback'
import fromEvent from 'promise-toolbox/fromEvent'
import mapValues from 'lodash/mapValues'
import pDefer from 'promise-toolbox/defer'
import using from 'promise-toolbox/using'
import { createLogger } from '@xen-orchestra/log/dist'
import { decorateWith } from '@vates/decorate-with'
import { execFile } from 'child_process'
import { formatFilenameDate } from '@xen-orchestra/backups/filenameDate'
import { formatVmBackup } from '@xen-orchestra/backups/formatVmBackup'
import { Xapi } from '@xen-orchestra/xapi'
import { ZipFile } from 'yazl'

import { asyncMap } from '../../../_asyncMap'

import { debounceResource } from '../../_debounceResource'
import { decorateResult } from '../../_decorateResult'
import { deduped } from '../../_deduped'

import { Backup } from './_Backup'
import { importDeltaVm } from './_deltaVm'
import { Task } from './_Task'
import { Readable } from 'stream'

const noop = Function.prototype

const { warn } = createLogger('xo:proxy:backups')

export default class Backups {
  constructor(app) {
    this._app = app

    // clean any LVM volumes that might have not been properly
    // unmounted
    app.hooks.on('start', async () => {
      await Promise.all([fromCallback(execFile, 'losetup', ['-D']), fromCallback(execFile, 'vgchange', ['-an'])])
      await fromCallback(execFile, 'pvscan', ['--cache'])
    })

    let run = ({ xapis, ...rest }) =>
      new Backup({
        ...rest,
        app,
        getConnectedXapi: id => this.getXapi(xapis[id]),
      }).run()

    const runningJobs = { __proto__: null }
    run = (run => {
      return async function (params) {
        const jobId = params.job.id
        if (jobId === undefined) {
          return run.apply(this, arguments)
        }
        if (jobId in runningJobs) {
          const error = new Error('job is already running')
          error.jobId = jobId
          throw error
        }
        runningJobs[jobId] = true
        try {
          return await run.apply(this, arguments)
        } finally {
          delete runningJobs[jobId]
        }
      }
    })(run)
    run = (run =>
      async function () {
        if (!__DEV__) {
          const license = await app.appliance.getSelfLicense()
          if (license === undefined || license.expires < Date.now()) {
            throw new Error('the proxy license is not valid')
          }
        }
        return run.apply(this, arguments)
      })(run)
    run = (run => async (params, onLog) => {
      if (onLog === undefined) {
        return run(params)
      }

      const { job, schedule } = params
      try {
        await Task.run(
          {
            name: 'backup run',
            data: {
              jobId: job.id,
              jobName: job.name,
              mode: job.mode,
              reportWhen: job.settings['']?.reportWhen,
              scheduleId: schedule.id,
            },
            onLog,
          },
          () => run(params)
        )
      } catch (error) {
        // do not rethrow, everything is handled via logging
      }
    })(run)

    const runWithLogs = args =>
      new Readable({
        objectMode: true,
        read() {
          this._read = noop

          run(args, log => this.push(log)).then(
            () => this.push(null),
            error => this.emit('error', error)
          )
        },
      })

    app.api.addMethods({
      backup: {
        deleteVmBackup: [
          ({ filename, remote }) => using(app.remotes.getAdapter(remote), adapter => adapter.deleteVmBackup(filename)),
          {
            description: 'delete VM backup',
            params: {
              filename: { type: 'string' },
              remote: { type: 'object' },
            },
          },
        ],
        fetchPartitionFiles: [
          ({ disk: diskId, remote, partition: partitionId, paths }) => {
            const { promise, reject, resolve } = pDefer()
            using(async function* () {
              const adapter = yield app.remotes.getAdapter(remote)
              const files = yield adapter.usePartitionFiles(diskId, partitionId, paths)
              const zip = new ZipFile()
              files.forEach(({ realPath, metadataPath }) => zip.addFile(realPath, metadataPath))
              zip.end()
              const { outputStream } = zip
              resolve(outputStream)
              await fromEvent(outputStream, 'end')
            }).catch(error => {
              warn(error)
              reject(error)
            })
            return promise
          },
          {
            description: 'fetch files from partition',
            params: {
              disk: { type: 'string' },
              partition: { type: 'string', optional: true },
              paths: { type: 'array', items: { type: 'string' } },
              remote: { type: 'object' },
            },
          },
        ],
        importVmBackup: [
          defer(($defer, { backupId, remote, srUuid, xapi: xapiOpts }) =>
            using(app.remotes.getAdapter(remote), this.getXapi(xapiOpts), async (adapter, xapi) => {
              const srRef = await xapi.call('SR.get_by_uuid', srUuid)

              const metadata = await adapter.readVmBackupMetadata(backupId)
              let vmRef
              if (metadata.mode === 'full') {
                vmRef = await xapi.VM_import(await adapter.readFullVmBackup(metadata), srRef)
              } else {
                assert.strictEqual(metadata.mode, 'delta')

                vmRef = await importDeltaVm(
                  await adapter.readDeltaVmBackup(metadata),
                  await xapi.getRecord('SR', srRef),
                  { detectBase: false }
                )
              }

              await Promise.all([
                xapi.call('VM.add_tags', vmRef, 'restored from backup'),
                xapi.call(
                  'VM.set_name_label',
                  vmRef,
                  `${metadata.vm.name_label} (${formatFilenameDate(metadata.timestamp)})`
                ),
              ])

              return xapi.getField('VM', vmRef, 'uuid')
            })
          ),
          {
            description: 'create a new VM from a backup',
            params: {
              backupId: { type: 'string' },
              remote: { type: 'object' },
              srUuid: { type: 'string' },
              xapi: { type: 'object' },
            },
          },
        ],
        listDiskPartitions: [
          ({ disk: diskId, remote }) =>
            using(app.remotes.getAdapter(remote), adapter => adapter.listPartitions(diskId)),
          {
            description: 'list disk partitions',
            params: {
              disk: { type: 'string' },
              remote: { type: 'object' },
            },
          },
        ],
        listPartitionFiles: [
          ({ disk: diskId, remote, partition: partitionId, path }) =>
            using(app.remotes.getAdapter(remote), adapter => adapter.listPartitionFiles(diskId, partitionId, path)),
          {
            description: 'list partition files',
            params: {
              disk: { type: 'string' },
              partition: { type: 'string', optional: true },
              path: { type: 'string' },
              remote: { type: 'object' },
            },
          },
        ],
        listVmBackups: [
          async ({ remotes }) => {
            const backups = {}
            await asyncMap(Object.keys(remotes), async remoteId => {
              try {
                await using(app.remotes.getAdapter(remotes[remoteId]), async adapter => {
                  backups[remoteId] = mapValues(await adapter.listAllVmBackups(), vmBackups =>
                    vmBackups.map(backup => formatVmBackup(backup))
                  )
                })
              } catch (error) {
                warn('listVmBackups', { error, remote: remotes[remoteId] })
              }
            })
            return backups
          },
          {
            description: 'list VM backups',
            params: {
              remotes: {
                type: 'object',
                additionalProperties: { type: 'object' },
              },
            },
          },
        ],
        listRunningJobs: [
          () => Object.keys(runningJobs),
          {
            description: 'returns a list of running jobs',
          },
        ],
        run: [
          ({ streamLogs = false, ...rest }) => (streamLogs ? runWithLogs(rest) : run(rest)),
          {
            description: 'run a backup job',
            params: {
              job: { type: 'object' },
              remotes: { type: 'object' },
              schedule: { type: 'object' },
              xapis: { type: 'object' },
              recordToXapi: { type: 'object' },
              streamLogs: { type: 'boolean', optional: true },
            },
          },
        ],
      },
    })

    const getPartition = Disposable.factory(function* ({ disk, partition, remote }) {
      const adapter = yield app.remotes.getAdapter(remote)
      return yield adapter.getPartition(disk, partition)
    })

    // private resource API is used exceptionally to be able to separate resource creation and release
    const partitionDisposers = {}
    const dispose = async () => {
      await asyncMap(Object.keys(partitionDisposers), path => {
        const disposers = partitionDisposers[path]
        delete partitionDisposers[path]
        return asyncMap(disposers, d => d(path).catch(noop))
      })
    }
    app.hooks.once('stop', dispose)

    app.api.addMethods({
      backup: {
        mountPartition: [
          async props => {
            const { value: path, dispose } = await getPartition(props)

            if (partitionDisposers[path] === undefined) {
              partitionDisposers[path] = []
            }
            partitionDisposers[path].push(dispose)

            return path
          },
          {
            description: 'mount a partition',
            params: {
              disk: { type: 'string' },
              partition: { type: 'string', optional: true },
              remote: { type: 'object' },
            },
          },
        ],
        unmountPartition: [
          async ({ path }) => {
            const disposers = partitionDisposers[path]
            if (disposers === undefined) {
              throw new Error(`No partition corresponding to the path ${path} found`)
            }

            await disposers.pop()()
            if (disposers.length === 0) {
              delete partitionDisposers[path]
            }
          },
          {
            description: 'unmount a partition',
            params: {
              path: { type: 'string' },
            },
          },
        ],
      },
    })
  }

  // FIXME: invalidate cache on options change
  @decorateResult(function (resource) {
    return debounceResource(resource, this._app.hooks, this._app.config.getDuration('resourceDebounce'))
  })
  @decorateWith(deduped, ({ url }) => [url])
  @decorateWith(Disposable.factory)
  async *getXapi({ credentials: { username: user, password }, ...opts }) {
    const xapi = new Xapi({
      ...this._app.config.get('xapiOptions'),
      ...opts,
      auth: {
        user,
        password,
      },
    })

    await xapi.connect()
    try {
      await xapi.objectsFetched

      yield xapi
    } finally {
      await xapi.disconnect()
    }
  }
}
