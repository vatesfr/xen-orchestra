import * as openpgp from 'openpgp'
import DepTree from 'deptree'
import fromCallback from 'promise-toolbox/fromCallback'
import { createLogger } from '@xen-orchestra/log'
import { gunzip, gzip } from 'node:zlib'

import { asyncMapValues } from '../_asyncMapValues.mjs'

const log = createLogger('xo:config-management')

export default class ConfigManagement {
  constructor(app) {
    this._app = app
    this._depTree = new DepTree()
    this._managers = { __proto__: null }
  }

  addConfigManager(id, exporter, importer, dependencies = []) {
    const managers = this._managers
    if (id in managers) {
      throw new Error(`${id} is already taken`)
    }

    this._depTree.add(id, dependencies)
    this._managers[id] = { dependencies, exporter, importer }
  }

  async exportConfig({ compress = false, entries, passphrase } = {}) {
    let managers = this._managers
    if (entries !== undefined) {
      const subset = { __proto__: null }
      entries.forEach(function addEntry(entry) {
        if (!(entry in subset)) {
          const manager = managers[entry]
          subset[entry] = manager
          manager.dependencies.forEach(addEntry)
        }
      })
      managers = subset
    }

    let config = JSON.stringify(await asyncMapValues(managers, ({ exporter }) => exporter()))

    if (compress) {
      config = await fromCallback(gzip, config)
    }

    if (passphrase !== undefined) {
      config = Buffer.from(
        await openpgp.encrypt({
          format: 'binary',
          message: await openpgp.createMessage(typeof config === 'string' ? { text: config } : { binary: config }),
          passwords: passphrase,
        })
      )
    }

    return config
  }

  async importConfig(config, { passphrase } = {}) {
    if (passphrase !== undefined) {
      config = (
        await openpgp.decrypt({
          format: 'binary',
          message: await openpgp.readMessage({ binaryMessage: config }),
          passwords: passphrase,
        })
      ).data
    }

    if (typeof config !== 'string' && config[0] === 0x1f && config[1] === 0x8b) {
      config = await fromCallback(gunzip, config)
    }

    config = JSON.parse(config)

    const managers = this._managers
    for (const key of this._depTree.resolve()) {
      const manager = managers[key]

      const data = config[key]
      if (data !== undefined) {
        log.debug(`importing ${key}`)
        await manager.importer(data)
      }
    }
    await this._app.hooks.clean()
  }
}
