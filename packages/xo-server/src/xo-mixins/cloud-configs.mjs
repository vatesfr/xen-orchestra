import { noSuchObject } from 'xo-common/api-errors.js'

import Collection from '../collection/redis.mjs'
import patch from '../patch.mjs'

class CloudConfigs extends Collection {}

export default class {
  constructor(app) {
    this._app = app

    app.hooks.on('clean', () => this._db.rebuildIndexes())
    app.hooks.on('core started', () => {
      const db = (this._db = new CloudConfigs({
        connection: app._redis,
        namespace: 'cloudConfig',
      }))

      return app.addConfigManager(
        'cloudConfigs',
        () => db.get(),
        cloudConfigs => db.update(cloudConfigs)
      )
    })
  }

  createCloudConfig(cloudConfig) {
    return this._db.add(cloudConfig)
  }

  async updateCloudConfig({ id, name, template }) {
    const cloudConfig = await this.getCloudConfig(id)
    patch(cloudConfig, { name, template })
    await this._db.update(cloudConfig)
  }

  deleteCloudConfig(id) {
    return this._db.remove(id)
  }

  async getAllCloudConfigs() {
    return (await this._db.get()).filter(({ type }) => type === undefined)
  }

  async getAllNetworkConfigs() {
    return (await this._db.get()).filter(({ type }) => type === 'network')
  }

  async getCloudConfig(id) {
    const cloudConfig = await this._db.first(id)
    if (cloudConfig === undefined) {
      throw noSuchObject(id, 'cloud config')
    }
    return cloudConfig
  }
}
