import * as openpgp from 'openpgp'
import createLogger from '@xen-orchestra/log'
import DepTree from 'deptree'

import { mapValues } from 'lodash'
import { pAll } from 'promise-toolbox'

const log = createLogger('xo:config-management')

export default class ConfigManagement {
  constructor(app) {
    this._app = app
    this._depTree = new DepTree()
    this._managers = { __proto__: null }
  }

  addConfigManager(id, exporter, importer, dependencies) {
    const managers = this._managers
    if (id in managers) {
      throw new Error(`${id} is already taken`)
    }

    this._depTree.add(id, dependencies)
    this._managers[id] = { exporter, importer }
  }

  async exportConfig({ passphrase } = {}) {
    let config = JSON.stringify(
      await mapValues(this._managers, ({ exporter }, key) => exporter())::pAll()
    )

    if (passphrase !== undefined) {
      config = Buffer.from(
        (
          await openpgp.encrypt({
            armor: false,
            message: openpgp.message.fromText(config),
            passwords: passphrase,
          })
        ).message.packets.write()
      )
    }

    return config
  }

  async importConfig(config, { passphrase } = {}) {
    if (passphrase !== undefined) {
      config = (
        await openpgp.decrypt({
          format: 'utf8',
          message: await openpgp.message.read(config),
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
    await this._app.clean()
  }
}
