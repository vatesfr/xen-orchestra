import cookie from 'cookie'
import defer from 'golike-defer'
import parseSetCookie from 'set-cookie-parser'
import pumpify from 'pumpify'
import split2 from 'split2'
import synchronized from 'decorator-synchronized'
import { compileTemplate } from '@xen-orchestra/template'
import { format, parse } from 'json-rpc-peer'
import { noSuchObject } from 'xo-common/api-errors'
import { NULL_REF } from 'xen-api'
import { omit } from 'lodash'
import { timeout } from 'promise-toolbox'

import Collection from '../collection/redis'
import parseDuration from '../_parseDuration'
import patch from '../patch'
import readChunk from '../_readStreamChunk'
import { generateToken } from '../utils'

const extractProperties = _ => _.properties
const omitToken = proxy => omit(proxy, 'authenticationToken')
const synchronizedWrite = synchronized()

export default class Proxy {
  constructor(app, conf) {
    this._app = app
    const xoProxyConf = (this._xoProxyConf = conf['xo-proxy'])
    const rules = {
      '{date}': (date = new Date()) => date.toISOString(),
    }
    this._generateDefaultProxyName = compileTemplate(
      xoProxyConf.proxyName,
      rules
    )
    this._generateDefaultVmName = compileTemplate(xoProxyConf.vmName, rules)
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
  async registerProxy({
    address,
    authenticationToken,
    name = this._generateDefaultProxyName(),
    vmUuid,
  }) {
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
    const { vmUuid } = await this._getProxy(id)
    if (vmUuid !== undefined) {
      await this._app.getXapi(vmUuid).deleteVm(vmUuid)
    }
    return this.unregisterProxy(id)
  }

  async _getProxy(id) {
    const proxy = await this._db.first(id)
    if (proxy === undefined) {
      throw noSuchObject(id, 'proxy')
    }
    return extractProperties(proxy)
  }

  getProxy(id) {
    return this._getProxy(id).then(omitToken)
  }

  getAllProxies() {
    return this._db.get().then(proxies => proxies.map(omitToken))
  }

  @synchronizedWrite
  async updateProxy(id, { address, authenticationToken, name, vmUuid }) {
    const proxy = await this._getProxy(id)
    await this._throwIfRegistered(
      proxy.address !== address ? address : undefined,
      proxy.vm !== vmUuid ? vmUuid : undefined
    )

    patch(proxy, { address, authenticationToken, name, vmUuid })
    return this._db
      .update(proxy)
      .then(extractProperties)
      .then(omitToken)
  }

  async upgradeProxyAppliance(id) {
    const { vmUuid } = await this._getProxy(id)
    const xapi = this._app.getXapi(vmUuid)
    await xapi.getObject(vmUuid).update_xenstore_data({
      'vm-data/xoa-updater-channel': JSON.stringify(this._xoProxyConf.channel),
    })

    return xapi.rebootVm(vmUuid)
  }

  @defer
  async deployProxy($defer, srId) {
    const app = this._app
    const xoProxyConf = this._xoProxyConf

    const namespace = xoProxyConf.namespace
    const {
      [namespace]: { xva },
    } = await app.getResourceCatalog()
    const xapi = app.getXapi(srId)
    let vm = await xapi.importVm(
      await app.requestResource({
        id: xva.id,
        namespace,
        version: xva.version,
      }),
      { srId }
    )
    $defer.onFailure.call(xapi, '_deleteVm', vm)

    const [
      password,
      proxyAuthenticationToken,
      { registrationToken, registrationEmail: email },
    ] = await Promise.all([
      generateToken(10),
      generateToken(),
      app.getApplianceRegistration(),
    ])
    const date = new Date()
    await Promise.all([
      vm.add_tags(xoProxyConf.vmTag),
      vm.set_name_label(this._generateDefaultVmName(date)),
      vm.update_xenstore_data({
        'vm-data/system-account-xoa-password': password,
        'vm-data/xo-proxy-authenticationToken': JSON.stringify(
          proxyAuthenticationToken
        ),
        'vm-data/xoa-updater-credentials': JSON.stringify({
          email,
          registrationToken,
        }),
        'vm-data/xoa-updater-channel': JSON.stringify(xoProxyConf.channel),
      }),
    ])

    await xapi.startVm(vm.$id)

    await vm.update_xenstore_data({
      'vm-data/system-account-xoa-password': null,
      'vm-data/xo-proxy-authenticationToken': null,
      'vm-data/xoa-updater-credentials': null,
    })

    // ensure appliance has an IP address
    const vmNetworksTimeout = parseDuration(xoProxyConf.vmNetworksTimeout)
    vm = await timeout.call(
      xapi._waitObjectState(vm.$id, _ => _.guest_metrics !== NULL_REF),
      vmNetworksTimeout
    )
    await timeout.call(
      xapi._waitObjectState(
        vm.guest_metrics,
        guest_metrics => guest_metrics.networks['0/ip'] !== undefined
      ),
      vmNetworksTimeout
    )

    // wait for the appliance to be upgraded
    const xoaUpgradeTimeout = parseDuration(xoProxyConf.xoaUpgradeTimeout)
    await timeout.call(
      xapi._waitObjectState(
        vm.$id,
        ({ xenstore_data }) =>
          xenstore_data['vm-data/xoa-updater-channel'] === undefined
      ),
      xoaUpgradeTimeout
    )

    const { id } = await this.registerProxy({
      authenticationToken: proxyAuthenticationToken,
      name: this._generateDefaultProxyName(date),
      vmUuid: vm.uuid,
    })

    await this.checkProxyHealth(id)
  }

  checkProxyHealth(id) {
    return this.callProxyMethod(id, 'system.getServerVersion')
  }

  async callProxyMethod(id, method, params, expectStream = false) {
    const proxy = await this._getProxy(id)
    if (proxy.address === undefined) {
      if (proxy.vmUuid === undefined) {
        throw new Error(
          'proxy VM and proxy address should not be both undefined'
        )
      }

      const vm = this._app.getXapi(proxy.vmUuid).getObjectByUuid(proxy.vmUuid)
      if ((proxy.address = vm.$guest_metrics?.networks['0/ip']) === undefined) {
        throw new Error(`cannot get the proxy VM IP (${proxy.vmUuid})`)
      }
    }

    const response = await this._app.httpRequest({
      body: format.request(0, method, params),
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie.serialize(
          'authenticationToken',
          proxy.authenticationToken
        ),
      },
      host: proxy.address,
      method: 'POST',
      pathname: '/api/v1',
      protocol: 'https:',
      rejectUnauthorized: false,
      timeout: parseDuration(this._xoProxyConf.callTimeout),
    })

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
