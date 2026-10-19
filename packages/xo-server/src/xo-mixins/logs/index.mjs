import { configure } from '@xen-orchestra/log/configure'
import { createCaptureTransport } from '@xen-orchestra/log/capture'
import { createLogger } from '@xen-orchestra/log'
import { dedupe } from '@xen-orchestra/log/dedupe'
import { defer, fromEvent } from 'promise-toolbox'

import LevelDbLogger from './loggers/leveldb.mjs'
import { REMOVE_CACHE_ENTRY } from '../../_pDebounceWithKey.mjs'

const { DEBUG } = process.env

const { warn } = createLogger('xo:mixins:logs')
export default class Logs {
  constructor(app) {
    /**
     * @type {import('@vates/types').XoApp}
     */
    this._app = app

    app.hooks.on('clean', () => this._gc())

    setInterval(
      () => {
        this._gc().catch(error => warn('error while interval log cleaning', error))
      },
      6 * 60 * 60 * 1000
    ).unref()

    app.config.watch('logs', ({ filter, level, transport: transportsObject }) => {
      const transports = []
      for (const id of Object.keys(transportsObject)) {
        const { disabled = false, ...transport } = transportsObject[id]
        if (!disabled) {
          transports.push({ type: id, ...transport })
        }
      }

      // merge env.DEBUG and filter entries, removing any duplicates
      //
      // undefined when empty
      const debug =
        Array.from(
          new Set(
            [DEBUG, filter]
              .filter(Boolean)
              .join(',')
              .split(',')
              .map(_ => _.trim())
          )
        ).join(',') || undefined

      // override env.DEBUG so that spawned process (workers) benefits from the new configuration as well
      process.env.DEBUG = debug

      configure(
        createCaptureTransport({
          filter: debug,
          level,
          transport: dedupe({ transport: transports }),
        })
      )
    })
  }

  async _gc(keep = 2e4) {
    const [db, backupLogs] = await Promise.all([
      this._app.getStore('logs'),
      this._app.getBackupNgLogs().catch(error => {
        warn('cannot snapshot backup logs, no remove events for this GC', { error })
        return {}
      }),
    ])
    const removedBackupLogs = []

    let count = 1
    const { promise, resolve } = defer()

    const cb = () => {
      if (--count === 0) {
        resolve()
      }
    }
    const stream = db.createKeyStream({
      reverse: true,
    })

    const deleteEntry = key => {
      ++count
      const backupLog = backupLogs[key]
      db.del(key, error => {
        if (error == null && backupLog?.message === 'backup') {
          removedBackupLogs.push(backupLog)
        }
        cb()
      })
    }

    const onData =
      keep !== 0
        ? () => {
            if (--keep === 0) {
              stream.on('data', deleteEntry)
              stream.removeListener('data', onData)
            }
          }
        : deleteEntry
    stream.on('data', onData)

    await fromEvent(stream, 'end')
    cb()
    await promise

    if (removedBackupLogs.length > 0) {
      this._app.getBackupNgLogs(REMOVE_CACHE_ENTRY)
      removedBackupLogs.forEach(backupLog => {
        this._app.getBackupNgLogs(REMOVE_CACHE_ENTRY, backupLog.id)
        this._app.backupLogsEe.emit('remove', undefined, backupLog)
      })
    }

    return promise
  }

  getLogger(namespace) {
    return this._app.getStore('logs').then(store => new LevelDbLogger(store, namespace))
  }

  async getLogs(namespace) {
    const logger = await this.getLogger(namespace)

    return new Promise((resolve, reject) => {
      const logs = {}

      logger
        .createReadStream()
        .on('data', data => {
          logs[data.key] = data.value
        })
        .on('end', () => {
          resolve(logs)
        })
        .on('error', reject)
    })
  }
}
