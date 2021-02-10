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

import { decorateResult } from '../../_decorateResult'
import { deduped } from '../../_deduped'

import { Backup } from './_Backup'
import { importDeltaVm } from './_deltaVm'
import { Task } from './_Task'
import { Readable } from 'stream'
import { RemoteAdapter } from './_RemoteAdapter'
import { RestoreMetadataBackup } from './_RestoreMetadataBackup'

const noop = Function.prototype

const { warn } = createLogger('xo:proxy:backups')

const runWithLogs = (runner, args) =>
  new Readable({
    objectMode: true,
    read() {
      this._read = noop

      runner(args, log => this.push(log)).then(
        () => this.push(null),
        error => this.emit('error', error)
      )
    },
  })

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

        // don't change config during backup execution
        config: app.config.get('backups'),

        // we passe getAdapter in order to mutualize the adapter resources usage
        getAdapter: this.getAdapter.bind(this),
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

    app.api.addMethods({
      backup: {
        deleteMetadataBackup: [
          ({ backupId, remote }) => using(this.getAdapter(remote), adapter => adapter.deleteMetadataBackup(backupId)),
          {
            description: 'delete Metadata backup',
            params: {
              backupId: { type: 'string' },
              remote: { type: 'object' },
            },
          },
        ],
        deleteVmBackup: [
          ({ filename, remote }) => using(this.getAdapter(remote), adapter => adapter.deleteVmBackup(filename)),
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
              const adapter = yield this.getAdapter(remote)
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
            using(this.getAdapter(remote), this.getXapi(xapiOpts), async (adapter, xapi) => {
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
          ({ disk: diskId, remote }) => using(this.getAdapter(remote), adapter => adapter.listPartitions(diskId)),
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
            using(this.getAdapter(remote), adapter => adapter.listPartitionFiles(diskId, partitionId, path)),
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
        listPoolMetadataBackups: [
          async ({ remotes }) => {
            const backupsByRemote = {}
            await asyncMap(Object.entries(remotes), async ([remoteId, remote]) => {
              try {
                await using(this.getAdapter(remote), async adapter => {
                  backupsByRemote[remoteId] = await adapter.listPoolMetadataBackups()
                })
              } catch (error) {
                warn('listPoolMetadataBackups', { error, remote })
              }
            })
            return backupsByRemote
          },
          {
            description: 'list pool metadata backups',
            params: {
              remotes: {
                type: 'object',
                additionalProperties: { type: 'object' },
              },
            },
          },
        ],
        listVmBackups: [
          async ({ remotes }) => {
            const backups = {}
            await asyncMap(Object.keys(remotes), async remoteId => {
              try {
                await using(this.getAdapter(remotes[remoteId]), async adapter => {
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
        listXoMetadataBackups: [
          async ({ remotes }) => {
            const backupsByRemote = {}
            await asyncMap(Object.entries(remotes), async ([remoteId, remote]) => {
              try {
                await using(this.getAdapter(remote), async adapter => {
                  backupsByRemote[remoteId] = await adapter.listXoMetadataBackups()
                })
              } catch (error) {
                warn('listXoMetadataBackups', { error, remote })
              }
            })
            return backupsByRemote
          },
          {
            description: 'list XO metadata backups',
            params: {
              remotes: {
                type: 'object',
                additionalProperties: { type: 'object' },
              },
            },
          },
        ],
        restoreMetadataBackup: [
          ({ backupId, remote, xapi: xapiOptions }) =>
            using(app.remotes.getHandler(remote), xapiOptions && this.getXapi(xapiOptions), (handler, xapi) =>
              runWithLogs(
                async (args, onLog) =>
                  Task.run(
                    {
                      name: 'metadataRestore',
                      data: JSON.parse(String(await handler.readFile(`${backupId}/metadata.json`))),
                      onLog,
                    },
                    () =>
                      new RestoreMetadataBackup({
                        backupId,
                        handler,
                        xapi,
                      }).run()
                  ).catch(() => {}) // errors are handled by logs
              )
            ),
          {
            description: 'restore a metadata backup',
            params: {
              backupId: { type: 'string' },
              remote: { type: 'object' },
              xapi: { type: 'object', optional: true },
            },
          },
        ],
        run: [
          ({ streamLogs = false, ...rest }) => (streamLogs ? runWithLogs(run, rest) : run(rest)),
          {
            description: 'run a backup job',
            params: {
              job: { type: 'object' },
              remotes: { type: 'object' },
              schedule: { type: 'object' },
              xapis: { type: 'object', optional: true },
              recordToXapi: { type: 'object', optional: true },
              streamLogs: { type: 'boolean', optional: true },
            },
          },
        ],
      },
    })

    const getPartition = Disposable.factory(function* ({ disk, partition, remote }) {
      const adapter = yield this.getAdapter(remote)
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

  // FIXME: invalidate cache on remote option change
  @decorateResult(function (resource) {
    return this._app.debounceResource(resource)
  })
  @decorateWith(deduped, remote => [remote.url])
  @decorateWith(Disposable.factory)
  *getAdapter(remote) {
    const app = this._app
    return new RemoteAdapter(yield app.remotes.getHandler(remote), {
      debounceResource: app.debounceResource.bind(app),
      dirMode: app.config.get('backups.dirMode'),
    })
  }

  // FIXME: invalidate cache on options change
  @decorateResult(function (resource) {
    return this._app.debounceResource(resource)
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
