import cookie from 'cookie'
import parseSetCookie from 'set-cookie-parser'
import pumpify from 'pumpify'
import split2 from 'split2'
import synchronized from 'decorator-synchronized'
import { format, parse } from 'json-rpc-peer'
import { noSuchObject } from 'xo-common/api-errors'
import { timeout } from 'promise-toolbox'

import { omit } from 'lodash'

import Collection from '../collection/redis'
import parseDuration from '../_parseDuration'
import patch from '../patch'
import readChunk from '../_readStreamChunk'

const extractProperties = _ => _.properties
const synchronizedWrite = synchronized()

export default class Proxy {
  constructor(app, conf) {
    this._app = app
    this._xoProxyConf = conf['xo-proxy']
    const db = (this._db = new Collection({
      connection: app._redis,
      indexes: ['address', 'vmUuid'],
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

  async _throwIfRegistered(address, vmUuid) {
    if (address != null && (await this._db.exists({ address }))) {
      throw new Error(
        `A proxy with the address (${address}) is already registered`
      )
    }
    if (vmUuid != null && (await this._db.exists({ vmUuid }))) {
      throw new Error(`A proxy with the vm (${vmUuid}) is already registered`)
    }
  }

  @synchronizedWrite
  async registerProxy({ address, authenticationToken, name, vmUuid }) {
    await this._throwIfRegistered(address, vmUuid)

    return this._db
      .add({
        address,
        authenticationToken,
        name,
        vmUuid,
      })
      .then(extractProperties)
  }

  unregisterProxy(id) {
    return this._db.remove(id)
  }

  async destroyProxy(id) {
    const { vmUuid } = await this.getProxy(id)
    if (vmUuid !== undefined) {
      await this._app.getXapi(vmUuid)._deleteVm(vmUuid)
    }
    return this.unregisterProxy(id)
  }

  async getProxy(id) {
    const proxy = await this._db.first(id)
    if (proxy === undefined) {
      throw noSuchObject(id, 'proxy')
    }
    return omit(extractProperties(proxy), 'authenticationToken')
  }

  getAllProxies() {
    return this._db
      .get()
      .then(proxies =>
        proxies.map(({ authenticationToken, ...proxy }) => proxy)
      )
  }

  @synchronizedWrite
  async updateProxy(id, { address, authenticationToken, name, vmUuid }) {
    await this._throwIfRegistered(address, vmUuid)

    const proxy = await this.getProxy(id)
    patch(proxy, { address, authenticationToken, name, vmUuid })
    return this._db.update(proxy).then(extractProperties)
  }

  async callProxyMethod(id, method, params, expectStream = false) {
    const proxy = await this.getProxy(id)
    if (proxy.address === undefined) {
      if (proxy.vmUuid === undefined) {
        throw new Error(
          'proxy VM and proxy address should not be both undefined'
        )
      }

      const vm = this._app.getXapi(proxy.vmUuid).getObjectByUuid(proxy.vmUuid)
      if ((proxy.address = vm.$guest_metrics.networks['0/ip']) === undefined) {
        throw new Error(`cannot get the proxy VM IP (${proxy.vmUuid})`)
      }
    }

    const response = await timeout.call(
      this._app.httpRequest(proxy.address, {
        body: format.request(0, method, params),
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.serialize(
            'authenticationToken',
            proxy.authenticationToken
          ),
        },
        method: 'POST',
        pathname: '/api/v1',
      }),
      parseDuration(this._xoProxyConf.callTimeout)
    )

    const authenticationToken = parseSetCookie(response, {
      map: true,
    }).authenticationToken?.value
    if (authenticationToken !== undefined) {
      await this.updateProxy(id, { authenticationToken })
    }

    const lines = pumpify(response, split2())
    const firstLine = await readChunk(lines)

    const { result, error } = parse(String(firstLine))
    if (error !== undefined) {
      throw error
    }
    const isStream = result.$responseType === 'ndjson'
    if (isStream !== expectStream) {
      throw new Error(
        `expect the result ${expectStream ? '' : 'not'} to be a stream`
      )
    }

    if (isStream) {
      return lines
    }
    lines.destroy()
    return result
  }
}
