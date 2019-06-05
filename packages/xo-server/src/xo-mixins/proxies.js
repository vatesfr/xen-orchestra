import synchronized from 'decorator-synchronized'
import { noSuchObject } from 'xo-common/api-errors'

import Collection from '../collection/redis'
import patch from '../patch'

const sync = synchronized.withKey((arg1, arg2) => {
  // In case of "updateProxy"
  if (typeof arg1 === 'string') {
    const id = arg1
    const props = arg2
    return props.address ?? id
  }

  return arg1.address
})

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

  @sync
  async registerProxy({ address, authenticationToken, name }) {
    await this._throwIfRegistered(address)

    const { properties } = await this._db.add({
      address,
      authenticationToken,
      name,
    })
    return properties
  }

  unregisterProxy(id) {
    return this._db.remove(id)
  }

  async getProxy(id) {
    const proxy = await this._db.first(id)
    if (proxy === undefined) {
      throw noSuchObject(id, 'proxy')
    }
    return proxy.properties
  }

  getAllProxies() {
    return this._db.get()
  }

  @sync
  async updateProxy(id, { address, authenticationToken, name }) {
    const proxy = await this.getProxy(id)
    if (address != null && proxy.address !== address) {
      await this._throwIfRegistered(address)
    }

    patch(proxy, { address, authenticationToken, name })
    const { properties } = await this._db.update(proxy)
    return properties
  }
}
