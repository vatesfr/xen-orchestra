import Disposable from 'promise-toolbox/Disposable'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import { Backup } from '@xen-orchestra/backups/Backup'
import { compose } from '@vates/compose'
import { createDebounceResource } from '@vates/disposable/debounceResource'
import { decorateWith } from '@vates/decorate-with'
import { deduped } from '@vates/disposable/deduped'
import { getHandler } from '@xen-orchestra/fs'
import { parseDuration } from '@vates/parse-duration'
import { RemoteAdapter } from '@xen-orchestra/backups/RemoteAdapter'
import { Task } from '@xen-orchestra/backups/Task'
import { Xapi } from '@xen-orchestra/xapi'

class BackupWorker {
  constructor({ config, job, recordToXapi, remotes, schedule, xapis }) {
    this._config = config
    this._job = job
    this._recordToXapi = recordToXapi
    this._remotes = remotes
    this._schedule = schedule
    this._xapis = xapis

    const debounceResource = createDebounceResource()
    debounceResource.defaultDelay = parseDuration(config.resourceCacheDelay)
    this.debounceResource = debounceResource
  }

  run() {
    return new Backup({
      config: this._config.backups,
      getAdapter: remoteId => this.getAdapter(this._remotes[remoteId]),
      getConnectedRecord: Disposable.factory(async function* getConnectedRecord(type, uuid) {
        const xapiId = this._recordToXapi[uuid]
        if (xapiId === undefined) {
          throw new Error('no XAPI associated to ' + uuid)
        }

        const xapi = yield this.getXapi(this._xapis[xapiId])
        return xapi.getRecordByUuid(type, uuid)
      }).bind(this),
      job: this._job,
      schedule: this._schedule,
    }).run()
  }

  @decorateWith(compose, function (resource) {
    return this.debounceResource(resource)
  })
  @decorateWith(deduped, remote => [remote.url])
  @decorateWith(Disposable.factory)
  async *getAdapter(remote) {
    const config = this._config
    const handler = getHandler(remote, config.remoteOptions)
    await handler.sync()
    try {
      yield new RemoteAdapter(handler, {
        debounceResource: this.debounceResource,
        dirMode: config.backups.dirMode,
      })
    } finally {
      await handler.forget()
    }
  }

  @decorateWith(compose, function (resource) {
    return this.debounceResource(resource)
  })
  @decorateWith(deduped, ({ url }) => [url])
  @decorateWith(Disposable.factory)
  async *getXapi({ credentials: { username: user, password }, ...opts }) {
    const xapi = new Xapi({
      ...this._config.xapiOptions,
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

const noop = Function.prototype
process.on('message', async args => {
  const backupWorker = new BackupWorker(args)
  await Task.run(
    {
      name: 'backup run',
      onLog: log => process.send(log),
    },
    () => backupWorker.run()
  ).catch(noop) // errors are handled by logs

  ignoreErrors.call(backupWorker.debounceResource.flushAll())

  process.send('end')
})
