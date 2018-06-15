// @flow
import { noSuchObject } from 'xo-common/api-errors'

import Collection from '../collection/redis'
import patch from '../patch'

type CloudConfig = {|
  id: string,
  name: string,
  template: string,
|}

class CloudConfigs extends Collection {
  get (properties) {
    return super.get(properties)
  }
}

export default class {
  _app: any
  _db: {|
    add: Function,
    first: Function,
    get: Function,
    remove: Function,
    update: Function,
  |}

  constructor (app: any) {
    this._app = app
    const db = (this._db = new CloudConfigs({
      connection: app._redis,
      prefix: 'xo:cloudConfig',
    }))

    app.on('clean', () => db.rebuildIndexes())
    app.on('start', () =>
      app.addConfigManager(
        'cloudConfigs',
        () => db.get(),
        cloudConfigs => db.update(cloudConfigs)
      )
    )
  }

  createCloudConfig (cloudConfig: $Diff<CloudConfig, {| id: string |}>) {
    return this._db.add(cloudConfig).properties
  }

  async updateCloudConfig ({ id, name, template }: $Shape<CloudConfig>) {
    const cloudConfig = await this.getCloudConfig(id)
    patch(cloudConfig, { name, template })
    return this._db.update(cloudConfig)
  }

  deleteCloudConfig (id: string) {
    return this._db.remove(id)
  }

  getAllCloudConfigs (): Promise<Array<CloudConfig>> {
    return this._db.get()
  }

  async getCloudConfig (id: string): Promise<CloudConfig> {
    const cloudConfig = await this._db.first(id)
    if (cloudConfig === null) {
      throw noSuchObject(id, 'cloud config')
    }
    return cloudConfig.properties
  }
}
