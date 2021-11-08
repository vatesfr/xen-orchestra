import * as openpgp from 'openpgp'
import DepTree from 'deptree'
import { createLogger } from '@xen-orchestra/log'

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

  async exportConfig({ entries, passphrase } = {}) {
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

    if (passphrase !== undefined) {
      config = Buffer.from(
        await openpgp.encrypt({
          format: 'binary',
          message: await openpgp.createMessage({ text: config }),
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
          message: await openpgp.readMessage({ binaryMessage: config }),
          passwords: passphrase,
        })
      ).data
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
