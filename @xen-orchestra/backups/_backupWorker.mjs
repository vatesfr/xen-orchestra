import { createLogger } from '@xen-orchestra/log'
import { catchGlobalErrors } from '@xen-orchestra/log/configure'

import Disposable from 'promise-toolbox/Disposable'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import { compose } from '@vates/compose'
import { createCachedLookup } from '@vates/cached-dns.lookup'
import { createDebounceResource } from '@vates/disposable/debounceResource.js'
import { createRunner } from './Backup.mjs'
import { decorateMethodsWith } from '@vates/decorate-with'
import { deduped } from '@vates/disposable/deduped.js'
import { getHandler } from '@xen-orchestra/fs'
import { parseDuration } from '@vates/parse-duration'
import { Task } from '@vates/task'
import { Xapi } from '@xen-orchestra/xapi'

import { RemoteAdapter } from './RemoteAdapter.mjs'

createCachedLookup().patchGlobal()

const logger = createLogger('xo:backups:worker')
catchGlobalErrors(logger)
const { debug } = logger

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
    return createRunner({
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

  async *getAdapter(remote) {
    const handler = getHandler(remote, this.#remoteOptions)
    await handler.sync()
    try {
      yield new RemoteAdapter(handler, {
        debounceResource: this.debounceResource,
        dirMode: this.#config.dirMode,
        vhdDirectoryCompression: this.#config.vhdDirectoryCompression,
      })
    } finally {
      await handler.forget()
    }
  }

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

decorateMethodsWith(BackupWorker, {
  getAdapter: compose([
    Disposable.factory,
    [deduped, remote => [remote.url]],
    [
      compose,
      function (resource) {
        return this.debounceResource(resource)
      },
    ],
  ]),

  getXapi: compose([
    Disposable.factory,
    [deduped, xapi => [xapi.url]],
    [
      compose,
      function (resource) {
        return this.debounceResource(resource)
      },
    ],
  ]),
})

const emitMessage = message => {
  debug('message emitted', { message })
  process.send(message)
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
  debug('message received', { message })

  if (message.action === 'run') {
    const backupWorker = new BackupWorker(message.data)
    try {
      const result = message.runWithLogs
        ? await Task.run(
            {
              properties: { name: 'backup run' },
              onProgress: data =>
                emitMessage({
                  data,
                  type: 'log',
                }),
            },
            () => backupWorker.run()
          )
        : await backupWorker.run()

      emitMessage({
        type: 'result',
        result,
        status: 'success',
      })
    } catch (error) {
      emitMessage({
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
