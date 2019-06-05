import synchronized from 'decorator-synchronized'
import { noSuchObject } from 'xo-common/api-errors'

import Collection from '../collection/redis'
import patch from '../patch'

const extractProperties = _ => _.properties
const synchonizedWrite = synchronized()

export default class Proxy {
  constructor(app) {
    const db = (this._db = new Collection({
      connection: app._redis,
      indexes: ['address'],
      prefix: 'xo:proxy',
    }))

    app.on('clean', () => db.rebuildIndexes())
    app.on('start', () =>
      app.addConfigManager(
        'proxies',
        () => db.get(),
        proxies => db.update(proxies)
      )
    )
  }

  async _throwIfRegistered(address) {
    if (await this._db.exists({ address })) {
      throw new Error(
        `A proxy with the address (${address}) is already registered`
      )
    }
  }

  @synchonizedWrite
  async registerProxy({ address, authenticationToken, name }) {
    await this._throwIfRegistered(address)

    return this._db
      .add({
        address,
        authenticationToken,
        name,
      })
      .then(extractProperties)
  }

  unregisterProxy(id) {
    return this._db.remove(id)
  }

  async getProxy(id) {
    const proxy = await this._db.first(id).then(extractProperties)
    if (proxy === undefined) {
      throw noSuchObject(id, 'proxy')
    }
    return proxy
  }

  getAllProxies() {
    return this._db.get()
  }

  @synchonizedWrite
  async updateProxy(id, { address, authenticationToken, name }) {
    const proxy = await this.getProxy(id)
    if (address !== undefined && proxy.address !== address) {
      await this._throwIfRegistered(address)
    }

    patch(proxy, { address, authenticationToken, name })
    return this._db.update(proxy).then(extractProperties)
  }
}
