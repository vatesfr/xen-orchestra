import transportConsole from '@xen-orchestra/log/transports/console.js'
import { configure } from '@xen-orchestra/log/configure.js'
import { defer, fromEvent } from 'promise-toolbox'

import LevelDbLogger from './loggers/leveldb.mjs'

export default class Logs {
  constructor(app) {
    this._app = app

    app.hooks.on('clean', () => this._gc())

    const transport = transportConsole()
    app.config.watch('logs', ({ filter, level }) => {
      configure([
        {
          filter: [process.env.DEBUG, filter],
          level,
          transport,
        },
      ])
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
