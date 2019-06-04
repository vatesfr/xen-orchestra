import setCookie from 'set-cookie-parser'
import split2 from 'split2'
import synchronized from 'decorator-synchronized'
import { format, parse } from 'json-rpc-peer'
import { noSuchObject } from 'xo-common/api-errors'
import { pipeline } from 'readable-stream'

import Collection from '../collection/redis'
import patch from '../patch'
import readChunk from '../_readStreamChunk'

const extractProperties = _ => _.properties
const synchronizedWrite = synchronized()

export default class Proxy {
  constructor(app) {
    this._app = app
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

  @synchronizedWrite
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

  @synchronizedWrite
  async updateProxy(id, { address, authenticationToken, name }) {
    const proxy = await this.getProxy(id)
    if (address !== undefined && proxy.address !== address) {
      await this._throwIfRegistered(address)
    }

    patch(proxy, { address, authenticationToken, name })
    return this._db.update(proxy).then(extractProperties)
  }

  async callProxyMethod(id, method, params, expectStream = false) {
    const proxy = await this.getProxy(id)

    const { httpRequest } = this._app
    const response = await httpRequest(proxy.address, {
      body: format.request(0, method, params),
      headers: {
        'Content-Type': 'application/json',
        Cookie: `authenticationToken=${proxy.authenticationToken}`,
      },
      method: 'POST',
      pathname: '/api/v1',
    })

    const authenticationToken = setCookie(response, {
      map: true,
    })?.authenticationToken?.value
    if (authenticationToken !== undefined) {
      await this.updateProxy(id, { authenticationToken })
    }

    const lines = pipeline(response, split2(), () => {})
    const firstLine = await readChunk(lines)

    const { result, error } = parse(firstLine)
    if (error !== undefined) {
      throw error
    }
    const isStream = result.$responseType === 'ndjson'
    if (isStream !== expectStream) {
      throw new Error(
        `expect the type of result to ${expectStream ? '' : 'not'} be a stream`
      )
    }
    return isStream ? lines : result
  }
}
