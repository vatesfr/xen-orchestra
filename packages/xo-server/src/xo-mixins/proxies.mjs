import assert from 'assert'
import contentType from 'content-type'
import cookie from 'cookie'
import hrp from 'http-request-plus'
import isEmpty from 'lodash/isEmpty.js'
import omit from 'lodash/omit.js'
import parseSetCookie from 'set-cookie-parser'
import pumpify from 'pumpify'
import some from 'lodash/some.js'
import split2 from 'split2'
import { compileTemplate } from '@xen-orchestra/template'
import { createLogger } from '@xen-orchestra/log'
import { decorateWith } from '@vates/decorate-with'
import { defer } from 'golike-defer'
import { format, parse } from 'json-rpc-peer'
import { incorrectState, invalidParameters, noSuchObject } from 'xo-common/api-errors.js'
import { parseDuration } from '@vates/parse-duration'
import { readChunk } from '@vates/read-chunk'
import { Ref } from 'xen-api'
import { synchronized } from 'decorator-synchronized'
import { timeout } from 'promise-toolbox'

import Collection from '../collection/redis.mjs'
import patch from '../patch.mjs'
import { debounceWithKey, REMOVE_CACHE_ENTRY } from '../_pDebounceWithKey.mjs'
import { extractIpFromVmNetworks } from '../_extractIpFromVmNetworks.mjs'
import { generateToken } from '../utils.mjs'

const DEBOUNCE_TIME_PROXY_STATE = 60000

const synchronizedWrite = synchronized()

const log = createLogger('xo:proxy')

function addProxyUrl(proxy) {
  const url = new URL('https://localhost')
  url.username = proxy.authenticationToken

  const { address } = proxy
  if (address !== undefined) {
    url.host = address
  } else {
    try {
      const vm = this._app.getXapiObject(proxy.vmUuid, 'VM')
      const hostname = extractIpFromVmNetworks(vm.$guest_metrics?.networks)
      if (hostname === undefined) {
        return
      }
      url.hostname = hostname
    } catch (error) {
      log.warn('addProxyUrl', { error, proxy })
      return
    }
  }

  delete proxy.authenticationToken
  proxy.url = url.href
}

async function addProxyVersion(proxy) {
  try {
    const versionInfo = await this.callProxyMethod(proxy.id, 'system.getServerVersion')

    proxy.version = versionInfo
  } catch (error) {
    log.warn('addProxyVersion', { error, proxy })
    return
  }
}

async function populateProxy(proxy) {
  addProxyUrl.call(this, proxy)
  await addProxyVersion.call(this, proxy)
}

export default class Proxy {
  constructor(app) {
    this._app = app
    const rules = {
      '{date}': (date = new Date()) => date.toISOString(),
    }
    app.config.watch('xo-proxy', xoProxyConf => {
      this._generateDefaultProxyName = compileTemplate(xoProxyConf.proxyName, rules)
      this._generateDefaultVmName = compileTemplate(xoProxyConf.vmName, rules)
    })

    app.hooks.on('clean', () => this._db.rebuildIndexes())
    app.hooks.on('core started', () => {
      const db = (this._db = new Collection({
        connection: app._redis,
        indexes: ['address', 'vmUuid'],
        namespace: 'proxy',
      }))

      return app.addConfigManager(
        'proxies',
        () => db.get(),
        proxies => db.update(proxies)
      )
    })
  }

  async _getChannel() {
    const PLACEHOLDER = '{xoChannel}'
    let channel = this._app.config.get('xo-proxy.channel')
    const i = channel.indexOf(PLACEHOLDER)
    if (i !== -1) {
      const xoChannel = await this._app.getCurrentChannel()
      channel = channel.slice(0, i) + xoChannel + channel.slice(i + PLACEHOLDER.length)
    }
    return channel
  }

  async _throwIfRegistered(address, vmUuid) {
    if (address != null && (await this._db.exists({ address }))) {
      throw new Error(`A proxy with the address (${address}) is already registered`)
    }
    if (vmUuid != null && (await this._db.exists({ vmUuid }))) {
      throw new Error(`A proxy with the vm (${vmUuid}) is already registered`)
    }
  }

  @synchronizedWrite
  async registerProxy({ address, authenticationToken, name = this._generateDefaultProxyName(), vmUuid }) {
    if (address === undefined && vmUuid === undefined) {
      throw invalidParameters('at least one of address and vmUuid must be defined')
    }

    if (authenticationToken === undefined) {
      authenticationToken = await generateToken()
    }

    await this._throwIfRegistered(address, vmUuid)

    const { id } = await this._db.add({
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
        .unbindLicense?.({
          boundObjectId: vmUuid,
          productId: this._app.config.get('xo-proxy.licenseProductId'),
        })
        .catch(log.warn)
    }
  }

  async destroyProxy(id) {
    const { vmUuid } = await this._getProxy(id)
    if (vmUuid !== undefined) {
      try {
        await this._app.getXapiObject(vmUuid).$destroy()
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
    return proxy
  }

  async getProxy(id) {
    const proxy = await this._getProxy(id)
    await populateProxy.call(this, proxy)

    return proxy
  }

  async getAllProxies() {
    const proxies = await this._db.get()
    await Promise.all(
      proxies.map(async proxy => {
        await populateProxy.call(this, proxy)
      })
    )
    return proxies
  }

  @synchronizedWrite
  async updateProxy(id, { address, authenticationToken, name, vmUuid }) {
    const proxy = await this._getProxy(id)
    await this._throwIfRegistered(
      proxy.address !== address ? address : undefined,
      proxy.vm !== vmUuid ? vmUuid : undefined
    )

    patch(proxy, { address, authenticationToken, name, vmUuid })
    await this._db.update(proxy)

    await populateProxy.call(this, proxy)
    return proxy
  }

  async upgradeProxyAppliance(id, { force = false, ignoreRunningJobs = force }) {
    if (!ignoreRunningJobs) {
      const stream = await this.callProxyMethod(id, 'backup.listRunningJobs', undefined, { assertType: 'iterator' })
      const ids = []
      for await (const id of stream) {
        ids.push(id)
      }
      if (ids.length !== 0) {
        throw incorrectState({ actual: ids, expected: [], object: 'runningJobs' })
      }
    }

    if (force) {
      // reboot upgrade (only available if the VM is known)
      await this.updateProxyAppliance(id, { upgrade: true })
    } else {
      // quick API upgrade
      await this.callProxyMethod(id, 'appliance.updater.upgrade', undefined, {
        timeout: this._app.config.getDuration('xo-proxy.xoaUpgradeTimeout'),
      })
    }

    this.getProxyApplianceUpdaterState(REMOVE_CACHE_ENTRY, id)
  }

  async updateProxyAppliance(id, { httpProxy, register = false, upgrade = false, xoaPassword }) {
    let credentials
    if (register) {
      const { registrationEmail: email, registrationToken } = await this._app.getApplianceRegistration()
      credentials = JSON.stringify({ email, registrationToken })
    }

    const { vmUuid } = await this._getProxy(id)
    const xapi = this._app.getXapi(vmUuid)
    await xapi.getObject(vmUuid).update_xenstore_data({
      'vm-data/system-account-xoa-password': xoaPassword,
      'vm-data/xoa-updater-channel': upgrade ? JSON.stringify(await this._getChannel()) : undefined,
      'vm-data/xoa-updater-credentials': credentials,
      'vm-data/xoa-updater-proxy-url': httpProxy && JSON.stringify(httpProxy),
    })

    try {
      await xapi.rebootVm(vmUuid)
    } catch (error) {
      if (error.code !== 'VM_BAD_POWER_STATE') {
        throw error
      }

      await xapi.startVm(vmUuid)
    }

    await xapi._waitObjectState(vmUuid, vm => extractIpFromVmNetworks(vm.$guest_metrics?.networks) !== undefined)
  }

  @decorateWith(debounceWithKey, DEBOUNCE_TIME_PROXY_STATE, id => id, false)
  async getProxyApplianceUpdaterState(id) {
    try {
      // ensure the updater is using the expected channel otherwise the state will not be correct
      await this.callProxyMethod(id, 'appliance.updater.configure', { channel: await this._getChannel() })
    } catch (error) {
      log.warn('failed to set proxy updater channel', { error })
    }

    return this.callProxyMethod(id, 'appliance.updater.getState')
  }

  @decorateWith(defer)
  async _createProxyVm($defer, srId, licenseId, { httpProxy, networkId, networkConfiguration }) {
    const app = this._app
    const xoProxyConf = app.config.get('xo-proxy')

    const namespace = xoProxyConf.namespace
    const {
      [namespace]: { xva },
    } = await app.getResourceCatalog()
    const xapi = app.getXapi(srId)
    const vm = await xapi._getOrWaitObject(
      await xapi.VM_import(
        await app.requestResource({
          id: xva.id,
          namespace,
          version: xva.version,
        }),
        srId && app.getObject(srId, 'SR')._xapiRef
      )
    )
    $defer.onFailure(() => xapi.VM_destroy(vm.$ref))

    const arg = { licenseId, boundObjectId: vm.uuid }
    await app.bindLicense(arg)
    $defer.onFailure(() => app.unbindLicense(arg))

    if (networkId !== undefined) {
      await Promise.all([
        ...vm.VIFs.map(vif => xapi.deleteVif(vif)),
        xapi.VIF_create({ network: xapi.getObject(networkId).$ref, VM: vm.$ref }),
      ])
    }

    const date = new Date()
    const proxyAuthenticationToken = await generateToken()

    const [password, { registrationToken, registrationEmail: email }] = await Promise.all([
      generateToken(10),
      app.getApplianceRegistration(),
    ])
    const xenstoreData = {
      // will be removed by xoa-first-run
      'vm-data/system-account-xoa-password': password,

      // will be removed by xo-proxy
      'vm-data/xo-proxy-authenticationToken': JSON.stringify(proxyAuthenticationToken),

      // will be removed by xoa-updater
      'vm-data/xoa-updater-credentials': JSON.stringify({
        email,
        registrationToken,
      }),
      'vm-data/xoa-updater-channel': JSON.stringify(await this._getChannel()),
    }
    if (httpProxy !== undefined) {
      // will be removed by xoa-updater
      xenstoreData['vm-data/xoa-updater-proxy-url'] = JSON.stringify(httpProxy)
    }
    if (networkConfiguration !== undefined) {
      // will be removed by xoa-first-run
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
    }
  }

  async deployProxy(srId, licenseId, { httpProxy, networkConfiguration, networkId, proxyId } = {}) {
    const app = this._app
    const xoProxyConf = app.config.get('xo-proxy')

    const redeploy = proxyId !== undefined
    if (redeploy) {
      const { vmUuid } = await this._getProxy(proxyId)
      if (vmUuid !== undefined) {
        try {
          await app.getXapiObject(vmUuid).$destroy()
        } catch (error) {
          if (!noSuchObject.is(error)) {
            throw error
          }
        }
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

    let { date, proxyAuthenticationToken, vm } = await this._createProxyVm(srId, licenseId, {
      httpProxy,
      networkConfiguration,
      networkId,
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

    const xapi = app.getXapi(srId)

    // ensure appliance has an IP address
    const vmNetworksTimeout = parseDuration(xoProxyConf.vmNetworksTimeout)
    vm = await timeout.call(
      xapi._waitObjectState(vm.$id, _ => Ref.isNotEmpty(_.guest_metrics)),
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
      xapi._waitObjectState(vm.$id, ({ xenstore_data }) => xenstore_data['vm-data/xoa-updater-channel'] === undefined),
      xoaUpgradeTimeout
    )

    await this.checkProxyHealth(proxyId)

    return proxyId
  }

  async checkProxyHealth(id) {
    await this.callProxyMethod(id, 'system.getServerVersion')
  }

  // enum assertType {iterator, scalar, stream}
  async callProxyMethod(
    id,
    method,
    params,
    { assertType = 'scalar', timeout = this._app.config.getDuration('xo-proxy.callTimeout') } = {}
  ) {
    const proxy = await this._getProxy(id)

    const url = new URL('https://localhost/api/v1')

    const request = {
      body: format.request(0, method, params),
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie.serialize('authenticationToken', proxy.authenticationToken),
      },
      method: 'POST',
      rejectUnauthorized: false,
      timeout,
    }

    if (proxy.address !== undefined) {
      url.host = proxy.address
    } else {
      const vm = this._app.getXapi(proxy.vmUuid).getObjectByUuid(proxy.vmUuid)

      const address = extractIpFromVmNetworks(vm.$guest_metrics?.networks)
      if (address === undefined) {
        const error = new Error('cannot get the proxy address')
        error.proxy = omit(proxy, 'authenticationToken')
        throw error
      }

      url.hostname = address.includes(':') ? `[${address}]` : address
    }

    const response = await hrp(url, request)

    const authenticationToken = parseSetCookie(response, {
      map: true,
    }).authenticationToken?.value
    if (authenticationToken !== undefined) {
      await this.updateProxy(id, { authenticationToken })
    }

    const responseType = contentType.parse(response).type
    if (responseType === 'application/octet-stream') {
      if (assertType !== 'stream') {
        response.destroy()
        throw new Error(`expect the result to be ${assertType}`)
      }
      return response
    }

    assert.strictEqual(responseType, 'application/json')

    const lines = pumpify.obj(response, split2(JSON.parse))
    const firstLine = await readChunk(lines)

    const result = parse.result(firstLine)
    const isIterator = result.$responseType === 'ndjson'
    if (assertType !== (isIterator ? 'iterator' : 'scalar')) {
      lines.destroy()
      throw new Error(`expect the result to be ${assertType}`)
    }

    if (isIterator) {
      return lines
    }
    lines.destroy()
    return result
  }
}
