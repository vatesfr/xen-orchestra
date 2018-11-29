import createLogger from '@xen-orchestra/log'
import DepTree from 'deptree'
import { mapValues } from 'lodash'
import { pAll } from 'promise-toolbox'

const log = createLogger('xo:config-management')

export default class ConfigManagement {
  constructor (app) {
    this._app = app
    this._depTree = new DepTree()
    this._managers = { __proto__: null }
  }

  addConfigManager (id, exporter, importer, dependencies) {
    const managers = this._managers
    if (id in managers) {
      throw new Error(`${id} is already taken`)
    }

    this._depTree.add(id, dependencies)
    this._managers[id] = { exporter, importer }
  }

  exportConfig () {
    return mapValues(this._managers, ({ exporter }, key) => exporter())::pAll()
  }

  async importConfig (config) {
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
