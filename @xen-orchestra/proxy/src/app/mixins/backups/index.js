import assert from 'assert'
import defer from 'golike-defer'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import { createLogger } from '@xen-orchestra/log/dist'
import { formatFilenameDate } from '@xen-orchestra/backups/filenameDate'
import { getHandler } from '@xen-orchestra/fs/dist'
import { Xapi } from '@xen-orchestra/xapi'

import { Backup } from './_Backup'
import { importDeltaVm } from './_deltaVm'
import { RemoteAdapter } from './_RemoteAdapter'
import { TaskLogger } from './_TaskLogger'
import { Readable } from 'stream'

const noop = Function.prototype

const { warn } = createLogger('xo:proxy:backups')

export default class Backups {
  constructor(
    app,
    { config: { backups: config, xapiOptions: globalXapiOptions } }
  ) {
    const createXapi = ({
      credentials: { username: user, password },
      ...opts
    }) =>
      new Xapi({
        ...globalXapiOptions,
        ...opts,
        auth: {
          user,
          password,
        },
      })

    let run = async ({ xapis: xapisOptions, ...rest }, taskLogger) => {
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
          config,
          getConnectedXapi,
          taskLogger,
        }).run()
      } finally {
        app.hooks.removeListener('stop', disconnectAllXapis)
        ignoreErrors.call(disconnectAllXapis())
      }
    }
    run = (run => {
      const runningJobs = { __proto__: null }
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
        const task = new TaskLogger(noop)
        return task.run('backup run', () => run(params, task))
      }

      const { job, schedule } = params
      const task = new TaskLogger(onLog)
      try {
        await task.run(
          'backup run',
          {
            jobId: job.id,
            jobName: job.name,
            mode: job.mode,
            reportWhen: job.settings['']?.reportWhen,
            scheduleId: schedule.id,
          },
          () => run(params, task)
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
        importVmBackup: [
          defer(
            async ($defer, { backupId, remote, srUuid, xapi: xapiOpts }) => {
              const adapter = new RemoteAdapter(
                await (async () => {
                  const handler = getHandler(remote)
                  await handler.sync()
                  $defer.call(handler, 'forget')
                  return handler
                })()
              )

              const xapi = createXapi(xapiOpts)
              await xapi.connect()
              $defer.call(xapi, 'disconnect')

              const srRef = await xapi.call('SR.get_by_uuid', srUuid)

              const metadata = await adapter.readVmBackupMetadata(backupId)
              let vmRef
              if (metadata.mode === 'full') {
                vmRef = await xapi.VM_import(
                  await adapter.readFullVmBackup(metadata),
                  srRef
                )
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
                  `${metadata.vm.name_label} (${formatFilenameDate(
                    metadata.timestamp
                  )})`
                ),
              ])

              return xapi.getField('VM', vmRef, 'uuid')
            }
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
        listVmBackups: [
          async ({ remotes }) => {
            const backups = {}
            await Promise.all(
              Object.keys(remotes).map(async remoteId => {
                try {
                  const handler = getHandler(remotes[remoteId])
                  await handler.sync()
                  try {
                    const adapter = new RemoteAdapter(handler)
                    backups[remoteId] = await adapter.listAllVmBackups()
                  } finally {
                    await handler.forget()
                  }
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
        run: [
          ({ streamLogs = false, ...rest }) =>
            streamLogs ? runWithLogs(rest) : run(rest),
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
  }
}
