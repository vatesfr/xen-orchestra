import assert from 'assert'
import defer from 'golike-defer'
import fromEvent from 'promise-toolbox/fromEvent'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import mapValues from 'lodash/mapValues'
import pDefer from 'promise-toolbox/defer'
import using from 'promise-toolbox/using'
import { createLogger } from '@xen-orchestra/log/dist'
import { formatFilenameDate } from '@xen-orchestra/backups/filenameDate'
import { formatVmBackup } from '@xen-orchestra/backups/formatVmBackup'
import { Xapi } from '@xen-orchestra/xapi'
import { ZipFile } from 'yazl'

import { disposable } from '../../_disposable'

import { Backup } from './_Backup'
import { importDeltaVm } from './_deltaVm'
import { Task } from './_Task'
import { Readable } from 'stream'

const noop = Function.prototype

const { warn } = createLogger('xo:proxy:backups')

export default class Backups {
  constructor(app, { config: { backups: config, xapiOptions: globalXapiOptions } }) {
    const createXapi = ({ credentials: { username: user, password }, ...opts }) =>
      new Xapi({
        ...globalXapiOptions,
        ...opts,
        auth: {
          user,
          password,
        },
      })

    let run = async ({ xapis: xapisOptions, ...rest }) => {
      const xapis = []
      async function createConnectedXapi(id) {
        const xapi = createXapi(xapisOptions[id])
        xapis.push(xapi)
        await xapi.connect()
        await xapi.objectsFetched
        return xapi
      }
      async function disconnectAllXapis() {
        const promises = xapis.map(xapi => xapi.disconnect())
        xapis.length = 0
        await Promise.all(promises)
      }
      app.hooks.on('stop', disconnectAllXapis)

      const connectedXapis = { __proto__: null }
      function getConnectedXapi(id) {
        let connectedXapi = connectedXapis[id]
        if (connectedXapi === undefined) {
          connectedXapi = createConnectedXapi(id)
          connectedXapis[id] = connectedXapi
        }
        return connectedXapi
      }

      try {
        await new Backup({
          ...rest,
          app,
          config,
          getConnectedXapi,
        }).run()
      } finally {
        app.hooks.removeListener('stop', disconnectAllXapis)
        ignoreErrors.call(disconnectAllXapis())
      }
    }
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
            using(app.remotes.getAdapter(remote), adapter =>
              using(adapter.usePartitionFiles(diskId, partitionId, paths), async files => {
                const zip = new ZipFile()
                files.forEach(({ realPath, metadataPath }) => zip.addFile(realPath, metadataPath))
                zip.end()
                const { outputStream } = zip
                resolve(outputStream)
                await fromEvent(outputStream, 'end')
              })
            ).catch(error => {
              warn(error)
              reject(error)
            })
            return promise
          },
          {
            description: 'fetch files from partition',
            params: {
              disk: { type: 'string' },
              partition: { type: 'string' },
              paths: { type: 'array', items: { type: 'string' } },
              remote: { type: 'object' },
            },
          },
        ],
        importVmBackup: [
          defer(($defer, { backupId, remote, srUuid, xapi: xapiOpts }) =>
            using(app.remotes.getAdapter(remote), async adapter => {
              const xapi = createXapi(xapiOpts)
              await xapi.connect()
              $defer.call(xapi, 'disconnect')

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
              partition: { type: 'string' },
              path: { type: 'string' },
              remote: { type: 'object' },
            },
          },
        ],
        listVmBackups: [
          async ({ remotes }) => {
            const backups = {}
            await Promise.all(
              Object.keys(remotes).map(async remoteId => {
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
            )
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

    const getPartition = disposable(function* ({ disk, partition, remote }) {
      const adapter = yield app.remotes.getAdapter(remote)
      return yield adapter.getPartition(disk, partition)
    })

    // private resource API is used exceptionally to be able to separate resource creation and release
    const partitionDisposers = {}
    const dispose = async () => {
      await Promise.all(
        Object.keys(partitionDisposers).map(path => {
          const disposers = partitionDisposers[path]
          delete partitionDisposers[path]
          return Promise.all(disposers.map(d => d(path).catch(noop)))
        })
      )
    }
    app.hooks.once('stop', dispose)

    app.api.addMethods({
      backup: {
        mountPartition: [
          async props => {
            const resource = getPartition(props)
            const path = await resource.p

            if (partitionDisposers[path] === undefined) {
              partitionDisposers[path] = []
            }
            partitionDisposers[path].push(resource.d)

            return path
          },
          {
            description: 'mount a partition',
            params: {
              disk: { type: 'string' },
              partition: { type: 'string' },
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
}
