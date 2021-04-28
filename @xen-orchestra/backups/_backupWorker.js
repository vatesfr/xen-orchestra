require('@xen-orchestra/log/configure.js').catchGlobalErrors(
  require('@xen-orchestra/log').createLogger('xo:backups:worker')
)

const Disposable = require('promise-toolbox/Disposable.js')
const ignoreErrors = require('promise-toolbox/ignoreErrors.js')
const { compose } = require('@vates/compose')
const { createDebounceResource } = require('@vates/disposable/debounceResource.js')
const { deduped } = require('@vates/disposable/deduped.js')
const { getHandler } = require('@xen-orchestra/fs')
const { parseDuration } = require('@vates/parse-duration')
const { Xapi } = require('@xen-orchestra/xapi')

const { Backup } = require('./Backup.js')
const { RemoteAdapter } = require('./RemoteAdapter.js')
const { Task } = require('./Task.js')

class BackupWorker {
  #config
  #job
  #recordToXapi
  #remoteOptions
  #remotes
  #schedule
  #xapiOptions
  #xapis

  constructor({ config, job, recordToXapi, remoteOptions, remotes, resourceCacheDelay, schedule, xapiOptions, xapis }) {
    this.#config = config
    this.#job = job
    this.#recordToXapi = recordToXapi
    this.#remoteOptions = remoteOptions
    this.#remotes = remotes
    this.#schedule = schedule
    this.#xapiOptions = xapiOptions
    this.#xapis = xapis

    const debounceResource = createDebounceResource()
    debounceResource.defaultDelay = parseDuration(resourceCacheDelay)
    this.debounceResource = debounceResource
  }

  run() {
    return new Backup({
      config: this.#config,
      getAdapter: remoteId => this.getAdapter(this.#remotes[remoteId]),
      getConnectedRecord: Disposable.factory(async function* getConnectedRecord(type, uuid) {
        const xapiId = this.#recordToXapi[uuid]
        if (xapiId === undefined) {
          throw new Error('no XAPI associated to ' + uuid)
        }

        const xapi = yield this.getXapi(this.#xapis[xapiId])
        return xapi.getRecordByUuid(type, uuid)
      }).bind(this),
      job: this.#job,
      schedule: this.#schedule,
    }).run()
  }

  getAdapter = Disposable.factory(this.getAdapter)
  getAdapter = deduped(this.getAdapter, remote => [remote.url])
  getAdapter = compose(this.getAdapter, function (resource) {
    return this.debounceResource(resource)
  })
  async *getAdapter(remote) {
    const handler = getHandler(remote, this.#remoteOptions)
    await handler.sync()
    try {
      yield new RemoteAdapter(handler, {
        debounceResource: this.debounceResource,
        dirMode: this.#config.dirMode,
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
      ...this.#xapiOptions,
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

// Received message:
//
// Message {
//   action: 'run'
//   data: object
//   runWithLogs: boolean
// }
//
// Sent message:
//
// Message {
//   type: 'log' | 'result'
//   data?: object
//   status?: 'success' | 'failure'
//   result?: any
// }
process.on('message', async message => {
  if (message.action === 'run') {
    const backupWorker = new BackupWorker(message.data)
    try {
      const result = message.runWithLogs
        ? await Task.run(
            {
              name: 'backup run',
              onLog: data =>
                process.send({
                  data,
                  type: 'log',
                }),
            },
            () => backupWorker.run()
          )
        : await backupWorker.run()

      process.send({
        type: 'result',
        result,
        status: 'success',
      })
    } catch (error) {
      process.send({
        type: 'result',
        result: error,
        status: 'failure',
      })
    } finally {
      await ignoreErrors.call(backupWorker.debounceResource.flushAll())
      process.disconnect()
    }
  }
})
