const Disposable = require('promise-toolbox/Disposable')
const ignoreErrors = require('promise-toolbox/ignoreErrors')
const { compose } = require('@vates/compose')
const { createDebounceResource } = require('@vates/disposable/debounceResource')
const { deduped } = require('@vates/disposable/deduped')
const { getHandler } = require('@xen-orchestra/fs')
const { parseDuration } = require('@vates/parse-duration')
const { Xapi } = require('@xen-orchestra/xapi')

const { RemoteAdapter } = require('./RemoteAdapter')
const { Backup } = require('./Backup')
const { Task } = require('./Task')

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

  getAdapter = Disposable.factory(this.getAdapter)
  getAdapter = deduped(this.getAdapter, remote => [remote.url])
  getAdapter = compose(this.getAdapter, function (resource) {
    return this.debounceResource(resource)
  })
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

  getXapi = Disposable.factory(this.getXapi)
  getXapi = deduped(this.getXapi, ({ url }) => [url])
  getXapi = compose(this.getXapi, function (resource) {
    return this.debounceResource(resource)
  })
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
process.on('message', async ({ runWithLogs = true, ...params }) => {
  const backupWorker = new BackupWorker(params)

  if (runWithLogs) {
    await Task.run(
      {
        name: 'backup run',
        onLog: log => process.send(log),
      },
      () => backupWorker.run()
    ).catch(noop) // errors are handled by logs

    await ignoreErrors.call(backupWorker.debounceResource.flushAll())

    process.send('end')
  } else {
    let result, error
    try {
      result = await backupWorker.run()
    } catch (err) {
      error = err
    }

    await ignoreErrors.call(backupWorker.debounceResource.flushAll())

    process.send({
      result,
      error,
    })
  }
})
