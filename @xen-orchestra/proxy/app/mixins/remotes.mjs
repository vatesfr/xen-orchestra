import Disposable from 'promise-toolbox/Disposable'
import { compose } from '@vates/compose'
import { decorateMethodsWith } from '@vates/decorate-with'
import { deduped } from '@vates/disposable/deduped.js'
import { getHandler } from '@xen-orchestra/fs'
import { RemoteAdapter } from '@xen-orchestra/backups/RemoteAdapter.mjs'
import { asyncEach } from '@vates/async-each'
import { BACKUP_DIR } from '@xen-orchestra/backups/_getVmBackupDir.mjs'
import { noSuchObject } from 'xo-common/api-errors.js'
import { Task } from '@vates/task'

export default class Remotes {
  constructor(app) {
    this._app = app

    app.api.addMethods({
      remote: {
        getInfo: [
          ({ remote }) => Disposable.use(this.getHandler(remote), handler => handler.getInfo()),
          {
            params: {
              remote: { type: 'object' },
            },
          },
        ],

        ping: [
          ({ remote }) => Disposable.use(this.getHandler(remote), () => ({ success: true })),
          {
            params: {
              remote: { type: 'object' },
            },
          },
        ],

        test: [
          ({ remote }) =>
            Disposable.use(this.getHandler(remote), handler => handler.test()).catch(error => ({
              success: false,
              error: error.message ?? String(error),
            })),
          {
            params: {
              remote: { type: 'object' },
            },
          },
        ],

        getTotalBackupSize: [
          ({ remote }) =>
            Disposable.use(this.getHandler(remote), handler => {
              const remoteAdapter = new RemoteAdapter(handler, {
                debounceResource: app.debounceResource.bind(app),
              })
              return remoteAdapter.getTotalBackupSize()
            }),
          {
            params: {
              remote: { type: 'object' },
            },
          },
        ],
        reclaimSpace: [
          ({ remote, vmUuid, merge = true, remove = true }) =>
            Disposable.use(this.getHandler(remote), async handler => {
              const remoteAdapter = new RemoteAdapter(handler, {
                debounceResource: app.debounceResource.bind(app),
              })

              const allVms = await remoteAdapter.listAllVms()
              if (vmUuid !== undefined && !allVms.includes(vmUuid)) {
                throw noSuchObject(vmUuid, 'VM')
              }
              const vmUuids = vmUuid !== undefined ? [vmUuid] : allVms
              Task.set('total', vmUuids.length)
              let done = 0

              const results = []
              await asyncEach(
                vmUuids,
                async uuid => {
                  try {
                    const { merge: didMerge, size } = await Task.run(
                      { properties: { name: `Clean VM ${uuid}`, data: { type: 'VM', id: uuid } } },
                      () =>
                        remoteAdapter.cleanVm(`${BACKUP_DIR}/${uuid}`, {
                          remove,
                          merge,
                          logInfo: Task.info,
                          logWarn: Task.warning,
                        })
                    )
                    results.push({ vmUuid: uuid, success: true, merge: didMerge, size })
                  } catch (error) {
                    results.push({
                      vmUuid: uuid,
                      success: false,
                      error: error instanceof Error ? error.message : String(error),
                    })
                  } finally {
                    done++
                    Task.set('progress', Math.round((done / vmUuids.length) * 100))
                  }
                },
                { concurrency: 2, stopOnError: false }
              )

              return results
            }),
          {
            params: {
              remote: { type: 'object' },
              vmUuid: { type: 'string', optional: true },
              merge: { type: 'boolean', optional: true },
              remove: { type: 'boolean', optional: true },
            },
          },
        ],
      },
    })
  }

  async getHandler(remote) {
    const { config } = this._app
    const handler = getHandler(remote, config.get('remoteOptions'))

    if (config.get('remotes.disableFileRemotes') && handler.type === 'file') {
      throw new Error('Local remotes are disabled in proxies')
    }

    await handler.sync()
    return new Disposable(() => handler.forget(), handler)
  }
}

decorateMethodsWith(Remotes, {
  getHandler: compose({ right: true }, [
    // FIXME: invalidate cache on remote option change
    [
      compose,
      function (resource) {
        return this._app.debounceResource(resource)
      },
    ],
    [deduped, remote => [remote.url]],
  ]),
})
