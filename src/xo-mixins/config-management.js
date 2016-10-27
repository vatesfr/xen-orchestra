import { map, noop } from '../utils'

import { all as pAll } from 'promise-toolbox'

export default class ConfigManagement {
  constructor () {
    this._managers = { __proto__: null }
  }

  addConfigManager (id, exporter, importer) {
    const managers = this._managers
    if (id in managers) {
      throw new Error(`${id} is already taken`)
    }

    this._managers[id] = { exporter, importer }
  }

  exportConfig () {
    return map(this._managers, ({ exporter }, key) => exporter())::pAll()
  }

  importConfig (config) {
    const managers = this._managers

    return map(config, (entry, key) => {
      const manager = managers[key]
      if (manager) {
        return manager.importer(entry)
      }
    })::pAll().then(noop)
  }
}
