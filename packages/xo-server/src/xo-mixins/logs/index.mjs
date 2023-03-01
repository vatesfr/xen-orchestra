import { configure } from '@xen-orchestra/log/configure'
import { dedupe } from '@xen-orchestra/log/dedupe'
import { defer, fromEvent } from 'promise-toolbox'

import LevelDbLogger from './loggers/leveldb.mjs'

const { DEBUG } = process.env

export default class Logs {
  constructor(app) {
    this._app = app

    app.hooks.on('clean', () => this._gc())

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

      configure({
        filter: debug,
        level,
        transport: dedupe({ transport: transports }),
      })
    })
  }

  async _gc(keep = 2e4) {
    const db = await this._app.getStore('logs')

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
      db.del(key, cb)
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
