import cookie from 'cookie'
import defer from 'golike-defer'
import parseSetCookie from 'set-cookie-parser'
import pumpify from 'pumpify'
import split2 from 'split2'
import synchronized from 'decorator-synchronized'
import { compileTemplate } from '@xen-orchestra/template'
import { createLogger } from '@xen-orchestra/log'
import { format, parse } from 'json-rpc-peer'
import { isEmpty, mapValues, some, omit } from 'lodash'
import { noSuchObject } from 'xo-common/api-errors'
import { NULL_REF } from 'xen-api'
import { timeout } from 'promise-toolbox'

import Collection from '../collection/redis'
import parseDuration from '../_parseDuration'
import patch from '../patch'
import readChunk from '../_readStreamChunk'
import { extractIpFromVmNetworks } from '../_extractIpFromVmNetworks'
import { generateToken } from '../utils'

const extractProperties = _ => _.properties
const omitToken = proxy => omit(proxy, 'authenticationToken')
const synchronizedWrite = synchronized()

const log = createLogger('xo:proxy')

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

    const {
      properties: { id },
    } = await this._db.add({
      address,
      authenticationToken,
      name,
      vmUuid,
    })
    return id
  }

  async unregisterProxy(id) {
    const { vmUuid } = await this._getProxy(id)

    await this._db.remove(id)

    if (vmUuid !== undefined) {
      // waiting the unbind of the license in order to be available at the end of the method call
      await this._app
        .unbindLicense({
          boundObjectId: vmUuid,
          productId: this._xoProxyConf.licenseProductId,
        })
        .catch(log.warn)
    }
  }

  async destroyProxy(id) {
    const { vmUuid } = await this._getProxy(id)
    if (vmUuid !== undefined) {
      try {
        await this._app.getXapi(vmUuid).deleteVm(vmUuid)
      } catch (error) {
        if (!noSuchObject.is(error)) {
          throw error
        }
      }
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
  async _createProxyVm(
    $defer,
    srId,
    licenseId,
    { networkId, networkConfiguration }
  ) {
    const app = this._app
    const xoProxyConf = this._xoProxyConf

    const namespace = xoProxyConf.namespace
    const {
      [namespace]: { xva },
    } = await app.getResourceCatalog()
    const xapi = app.getXapi(srId)
    const vm = await xapi.importVm(
      await app.requestResource({
        id: xva.id,
        namespace,
        version: xva.version,
      }),
      { srId }
    )
    $defer.onFailure(() => xapi._deleteVm(vm))

    const arg = { licenseId, boundObjectId: vm.uuid }
    await app.bindLicense(arg)
    $defer.onFailure(() => app.unbindLicense(arg))

    if (networkId !== undefined) {
      await Promise.all([
        ...vm.VIFs.map(vif => xapi.deleteVif(vif)),
        xapi.createVif(vm.$id, networkId),
      ])
    }

    const date = new Date()
    const proxyAuthenticationToken = await generateToken()

    const [
      password,
      { registrationToken, registrationEmail: email },
    ] = await Promise.all([generateToken(10), app.getApplianceRegistration()])
    const xenstoreData = {
      'vm-data/system-account-xoa-password': password,
      'vm-data/xo-proxy-authenticationToken': JSON.stringify(
        proxyAuthenticationToken
      ),
      'vm-data/xoa-updater-credentials': JSON.stringify({
        email,
        registrationToken,
      }),
      'vm-data/xoa-updater-channel': JSON.stringify(xoProxyConf.channel),
    }
    if (networkConfiguration !== undefined) {
      xenstoreData['vm-data/ip'] = networkConfiguration.ip
      xenstoreData['vm-data/gateway'] = networkConfiguration.gateway
      xenstoreData['vm-data/netmask'] = networkConfiguration.netmask
      xenstoreData['vm-data/dns'] = networkConfiguration.dns
    }
    await Promise.all([
      vm.add_tags(xoProxyConf.vmTag),
      vm.set_name_label(this._generateDefaultVmName(date)),
      vm.update_xenstore_data(xenstoreData),
    ])

    await xapi.startVm(vm.$id)

    return {
      date,
      proxyAuthenticationToken,
      vm,
      xenstoreData,
    }
  }

  async deployProxy(
    srId,
    licenseId,
    { networkConfiguration, networkId, proxyId } = {}
  ) {
    const app = this._app
    const xoProxyConf = this._xoProxyConf

    const redeploy = proxyId !== undefined
    if (redeploy) {
      const { vmUuid } = await this._getProxy(proxyId)
      if (vmUuid !== undefined) {
        await app.getXapi(vmUuid).deleteVm(vmUuid)
        await Promise.all([
          app
            .unbindLicense({
              boundObjectId: vmUuid,
              productId: xoProxyConf.licenseProductId,
            })
            .catch(log.warn),
          this.updateProxy(proxyId, {
            vmUuid: null,
          }),
        ])
      }
    }

    let {
      date,
      proxyAuthenticationToken,
      vm,
      xenstoreData,
    } = await this._createProxyVm(srId, licenseId, {
      networkId,
      networkConfiguration,
    })

    if (redeploy) {
      await this.updateProxy(proxyId, {
        authenticationToken: proxyAuthenticationToken,
        vmUuid: vm.uuid,
      })
    } else {
      proxyId = await this.registerProxy({
        authenticationToken: proxyAuthenticationToken,
        name: this._generateDefaultProxyName(date),
        vmUuid: vm.uuid,
      })
    }

    await vm.update_xenstore_data(
      mapValues(omit(xenstoreData, 'vm-data/xoa-updater-channel'), _ => null)
    )

    const xapi = app.getXapi(srId)

    // ensure appliance has an IP address
    const vmNetworksTimeout = parseDuration(xoProxyConf.vmNetworksTimeout)
    vm = await timeout.call(
      xapi._waitObjectState(vm.$id, _ => _.guest_metrics !== NULL_REF),
      vmNetworksTimeout
    )
    await timeout.call(
      xapi._waitObjectState(vm.guest_metrics, guest_metrics =>
        networkConfiguration === undefined
          ? !isEmpty(guest_metrics.networks)
          : some(guest_metrics.networks, ip => ip === networkConfiguration.ip)
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

    await this.checkProxyHealth(proxyId)
  }

  async checkProxyHealth(id) {
    await this.callProxyMethod(id, 'system.getServerVersion')
  }

  async callProxyMethod(id, method, params, expectStream = false) {
    const proxy = await this._getProxy(id)

    let ipAddress
    if (proxy.vmUuid !== undefined) {
      const vm = this._app.getXapi(proxy.vmUuid).getObjectByUuid(proxy.vmUuid)
      ipAddress = extractIpFromVmNetworks(vm.$guest_metrics?.networks)
    } else {
      ipAddress = proxy.address
    }

    if (ipAddress === undefined) {
      const error = new Error('cannot get the proxy IP')
      error.proxy = omit(proxy, 'authenticationToken')
      throw error
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
      hostname: ipAddress,
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
