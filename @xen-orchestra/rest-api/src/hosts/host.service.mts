import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import {
  HOST_POWER_STATE,
  Xapi,
  XcpPatches,
  XenApiHostWrapped,
  XoPool,
  XsPatches,
  type XoHost,
  type XoPif,
  IP_CONFIGURATION_MODE,
} from '@vates/types'
import { incorrectState, invalidParameters } from 'xo-common/api-errors.js'
import { parseXml, ensureArray } from '../helpers/utils.helper.mjs'
import type {
  MissingPatchesInfo,
  XoSrNfsExport,
  XoSrHbaExport,
  XoSrIscsiIqnsExport,
  XoSrIscsiLunsExport,
} from './host.type.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'
import semver from 'semver'
import { Task } from '@vates/task'

const log = createLogger('xo:rest-api:host-service')

export class HostService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  getHostsStatus(opts?: { filter?: string | ((obj: XoHost) => boolean) }) {
    const hosts = this.#restApi.getObjectsByType<XoHost>('host', opts)

    let nRunning = 0
    let nHalted = 0
    let nDisabled = 0
    let nUnknown = 0
    let total = 0

    for (const id in hosts) {
      total++
      const host = hosts[id as XoHost['id']]
      switch (host.power_state) {
        case HOST_POWER_STATE.RUNNING:
          if (!host.enabled) {
            nDisabled++
            break
          }
          nRunning++
          break
        case HOST_POWER_STATE.HALTED:
          nHalted++
          break
        default:
          nUnknown++
          break
      }
    }

    return {
      disabled: nDisabled,
      running: nRunning,
      halted: nHalted,
      unknown: nUnknown,
      total,
    }
  }

  /**
   * Throw if no authorization
   */
  async getMissingPatchesInfo({
    filter,
  }: { filter?: string | ((obj: XoHost) => boolean) } = {}): Promise<MissingPatchesInfo> {
    await this.#restApi.xoApp.checkFeatureAuthorization('LIST_MISSING_PATCHES')

    const hosts = Object.values(this.#restApi.getObjectsByType<XoHost>('host', { filter }))
    const missingPatches = new Map<string, XcpPatches | XsPatches>()
    const poolsWithMissingPatches = new Set()
    let nHostsWithMissingPatches = 0
    let nHostsFailed = 0

    await asyncEach(hosts, async (host: XoHost) => {
      const xapi = this.#restApi.xoApp.getXapi(host)

      try {
        const patches = await xapi.listMissingPatches(host.id)

        if (patches.length > 0) {
          nHostsWithMissingPatches++
          poolsWithMissingPatches.add(host.$pool)
          patches.forEach(patch => missingPatches.set(patch.id ?? patch.name, patch))
        }
      } catch (err) {
        log.error('listMissingPatches failed', err)
        nHostsFailed++
      }
    })

    return {
      hasAuthorization: true,
      missingPatches: Array.from(missingPatches.values()) as XcpPatches[] | XsPatches[],
      nHostsFailed,
      nHostsWithMissingPatches,
      nPoolsWithMissingPatches: poolsWithMissingPatches.size,
    }
  }

  async cleanShutdownHost(
    hostId: XoHost['id'],
    opts: {
      bypassBackupCheck?: boolean
      bypassEvacuate?: boolean
    } = {}
  ): Promise<void> {
    await this.#restApi.xoApp.backupGuard(hostId, {
      bypassBackupCheck: opts.bypassBackupCheck,
      operation: 'host.clean_shutdown',
    })

    await this.#restApi.getXapiObject(hostId, 'host').$xapi.shutdownHost(hostId, opts)
  }

  async cleanRebootHost(
    hostId: XoHost['id'],
    opts: {
      force: boolean
      bypassBackupCheck?: boolean
      bypassVersionCheck: boolean
    }
  ): Promise<void> {
    const { xapi } = await this.#rebootChecks(hostId, opts)

    await xapi.rebootHost(hostId, opts.force)
  }

  async smartRebootHost(
    hostId: XoHost['id'],
    opts: {
      bypassBackupCheck?: boolean
      bypassVersionCheck: boolean
      bypassBlockedSuspend: boolean
      bypassCurrentVmCheck: boolean
    }
  ): Promise<void> {
    await this.#restApi.xoApp.checkFeatureAuthorization('SMART_REBOOT')

    const { xapi, xapiHost } = await this.#rebootChecks(hostId, opts)

    await xapi.host_smartReboot(xapiHost.$ref, opts.bypassBlockedSuspend, opts.bypassCurrentVmCheck)
  }

  async restartToolstack(
    hostId: XoHost['id'],
    opts: {
      bypassBackupCheck?: boolean
    } = {}
  ): Promise<void> {
    await this.#restApi.xoApp.backupGuard(hostId, {
      bypassBackupCheck: opts.bypassBackupCheck,
      operation: 'host.restartAgent',
    })

    await this.#restApi.getXapiObject<XoHost>(hostId, 'host').$restartAgent()
  }

  /**
   * Move the management IP configuration of the host to the given PIF.
   */
  async moveManagementIp(hostId: XoHost['id'], pifId: XoPif['id']): Promise<void> {
    const host = this.#restApi.getObject<XoHost>(hostId)
    if (host.power_state !== HOST_POWER_STATE.RUNNING) {
      throw incorrectState({
        actual: host.power_state,
        expected: HOST_POWER_STATE.RUNNING,
        object: host.id,
        property: 'power_state',
      })
    }

    const pif = this.#restApi.getObject<XoPif>(pifId, 'PIF')
    if (pif.$host !== hostId) {
      throw invalidParameters(`the PIF ${pifId} does not belong to host ${hostId}`)
    }

    if (!pif.attached) {
      throw incorrectState({
        actual: pif.attached,
        expected: true,
        object: pif.id,
        property: 'attached',
      })
    }

    if (pif.management) {
      throw incorrectState({
        actual: pif.management,
        expected: false,
        object: pif.id,
        property: 'management',
      })
    }

    if (pif.mode !== IP_CONFIGURATION_MODE.NONE) {
      throw incorrectState({
        actual: pif.mode,
        expected: IP_CONFIGURATION_MODE.NONE,
        object: pif.id,
        property: 'mode',
      })
    }

    const managementPif = host.$PIFs
      .map(id => this.#restApi.getObject<XoPif>(id, 'PIF'))
      .find(hostPif => hostPif.management)

    if (managementPif === undefined) {
      throw incorrectState({
        actual: managementPif,
        expected: 'a management PIF',
        object: hostId,
        property: '$PIFs',
      })
    }

    if (managementPif.mode !== IP_CONFIGURATION_MODE.STATIC) {
      throw incorrectState({
        actual: managementPif.mode,
        expected: IP_CONFIGURATION_MODE.STATIC,
        object: managementPif.id,
        property: 'mode',
      })
    }

    const xapiHost = this.#restApi.getXapiObject<XoHost>(hostId, 'host')
    const xapi = xapiHost.$xapi
    await xapi.callAsync(
      'PIF.reconfigure_ip',
      pif._xapiRef,
      managementPif.mode,
      managementPif.ip,
      managementPif.netmask,
      managementPif.gateway,
      managementPif.dns
    )

    try {
      await xapi.callAsync('host.management_reconfigure', pif._xapiRef)
    } catch (error) {
      await this.#removePifIp(xapi, pif)
      throw error
    }

    try {
      await this.#removePifIp(xapi, managementPif)
    } catch (error) {
      Task.warning(
        'Management interface moved, but the IP could not be removed from the previous management PIF: please remove it manually',
        { pifId: managementPif.id, error }
      )
    }
  }

  async #removePifIp(xapi: Xapi, pif: XoPif): Promise<void> {
    await xapi.callAsync('PIF.reconfigure_ip', pif._xapiRef, IP_CONFIGURATION_MODE.NONE, '', '', '', '')
  }

  async #rebootChecks(
    hostId: XoHost['id'],
    opts: {
      bypassBackupCheck?: boolean
      bypassVersionCheck: boolean
    }
  ): Promise<{ xapi: Xapi; xapiHost: XenApiHostWrapped }> {
    const host = this.#restApi.getObject<XoHost>(hostId)
    const xapiHost = this.#restApi.getXapiObject<XoHost>(hostId, 'host')
    const poolId = host.$pool
    const xapi = xapiHost.$xapi

    await this.#restApi.xoApp.backupGuard(hostId, {
      bypassBackupCheck: opts.bypassBackupCheck,
      operation: 'host.reboot',
    })

    if (opts.bypassVersionCheck) {
      log.warn('host.reboot called with "bypassVersionCheck" set to true', { hostId })
    } else {
      const pool = this.#restApi.getObject<XoPool>(poolId, 'pool')
      const master = this.#restApi.getObject<XoHost>(pool.master, 'host')
      if (host.rebootRequired && host.id !== master.id) {
        const throwError = () =>
          incorrectState({
            actual: host.rebootRequired,
            expected: false,
            object: master.id,
            property: 'rebootRequired',
          })
        if (semver.lt(master.version, host.version)) {
          log.error(`master version (${master.version}) is older than the host version (${host.version})`, {
            masterId: master.id,
            hostId,
          })
          throwError()
        } else if (semver.eq(master.version, host.version)) {
          if ((await xapi.listMissingPatches(master.id)).length > 0) {
            log.error('master has missing patches', { masterId: master.id })
            throwError()
          }
          if (master.rebootRequired) {
            log.error('master needs to reboot', { masterId: master.id })
            throwError()
          }
        }
      }
    }

    return { xapi, xapiHost }
  }

  async probeNfs(id: XoHost['id'], server: string, nfsVersion?: string): Promise<XoSrNfsExport[]> {
    const xapiHost = this.#restApi.getXapiObject<XoHost>(id, 'host')
    const xapi = xapiHost.$xapi

    let xml: ReturnType<typeof parseXml>
    const deviceConfig = {
      nfsversion: nfsVersion,
      server,
    }

    try {
      await xapi.callAsync('SR.probe', xapiHost.$ref, deviceConfig, 'nfs', {})

      throw new Error('the call above should have thrown an error')
    } catch (error: any) {
      if (error.code !== 'SR_BACKEND_FAILURE_101') {
        throw error
      }

      xml = parseXml(error.params[2])
    }

    // NFSv4 doesn't return the full path, and we need to add a slash at the beginning of it, or SR creation with this path will fail
    const nfsExports: XoSrNfsExport[] = ensureArray(xml['nfs-exports'].Export).map(nfsExport => ({
      path: nfsExport.Path.trim().replace(/^\/?/, '/'),
      acl: nfsExport.Accesslist.trim(),
    }))

    return nfsExports
  }

  async probeZfs(id: XoHost['id']) {
    const xapiHost = this.#restApi.getXapiObject<XoHost>(id, 'host')
    const xapi = xapiHost.$xapi
    try {
      const result = (await xapi.callAsync('host.call_plugin', xapiHost.$ref, 'zfs.py', 'list_zfs_pools', {})) as string
      return JSON.parse(result)
    } catch (error: any) {
      if (error.code === 'XENAPI_MISSING_PLUGIN' || error.code === 'UNKNOWN_XENAPI_PLUGIN_FUNCTION') {
        return {}
      } else {
        throw error
      }
    }
  }

  async probeHba(id: XoHost['id']): Promise<XoSrHbaExport[]> {
    const xapiHost = this.#restApi.getXapiObject<XoHost>(id, 'host')
    const xapi = xapiHost.$xapi

    let xml: ReturnType<typeof parseXml>

    try {
      await xapi.callAsync('SR.probe', xapiHost.$ref, {}, 'lvmohba', {})

      throw new Error('the call above should have thrown an error')
    } catch (error: any) {
      if (error.code !== 'SR_BACKEND_FAILURE_107') {
        throw error
      }

      xml = parseXml(error.params[2])
    }

    const hbaDevices: XoSrHbaExport[] = ensureArray(xml.Devlist.BlockDevice).map(hbaDevice => ({
      hba: hbaDevice.hba.trim(),
      id: hbaDevice.id.trim(),
      lun: +hbaDevice.lun.trim(),
      path: hbaDevice.path.trim(),
      scsiId: hbaDevice.SCSIid.trim(),
      serial: hbaDevice.serial.trim(),
      size: +hbaDevice.size.trim(),
      vendor: hbaDevice.vendor.trim(),
    }))

    return hbaDevices
  }

  async probeIscsiIqns(
    id: XoHost['id'],
    targetIp: string,
    port?: number,
    chapUser?: string,
    chapPassword?: string
  ): Promise<XoSrIscsiIqnsExport[]> {
    const xapiHost = this.#restApi.getXapiObject<XoHost>(id, 'host')
    const xapi = xapiHost.$xapi

    type DeviceConfig = {
      target: string
      chapuser?: string
      chappassword?: string
      port?: string
    }

    const deviceConfig: DeviceConfig = {
      target: targetIp,
    }

    if (chapUser && chapPassword) {
      deviceConfig.chapuser = chapUser
      deviceConfig.chappassword = chapPassword
    }

    if (port) {
      deviceConfig.port = String(port)
    }

    let xml: ReturnType<typeof parseXml>

    try {
      await xapi.callAsync('SR.probe', xapiHost.$ref, deviceConfig, 'lvmoiscsi', {})

      throw new Error('the call above should have thrown an error')
    } catch (error: any) {
      if (error.code === 'SR_BACKEND_FAILURE_141') {
        return []
      }
      if (error.code !== 'SR_BACKEND_FAILURE_96') {
        throw error
      }

      xml = parseXml(error.params[2])
    }

    const targets: XoSrIscsiIqnsExport[] = ensureArray(xml['iscsi-target-iqns'].TGT)
      .filter(target => target.IPAddress.trim() === targetIp) // if the target is on another IP address, do not display it
      .map(target => ({
        iqn: target.TargetIQN.trim(),
        ip: target.IPAddress.trim(),
      }))

    return targets
  }

  async probeIscsiLuns(
    id: XoHost['id'],
    targetIp: string,
    targetIqn: string,
    port?: number,
    chapUser?: string,
    chapPassword?: string
  ): Promise<XoSrIscsiLunsExport[]> {
    const xapiHost = this.#restApi.getXapiObject<XoHost>(id, 'host')
    const xapi = xapiHost.$xapi

    type DeviceConfig = {
      target: string
      targetIQN: string
      chapuser?: string
      chappassword?: string
      port?: string
    }

    const deviceConfig: DeviceConfig = {
      target: targetIp,
      targetIQN: targetIqn,
    }

    if (chapUser && chapPassword) {
      deviceConfig.chapuser = chapUser
      deviceConfig.chappassword = chapPassword
    }

    if (port) {
      deviceConfig.port = String(port)
    }

    let xml: ReturnType<typeof parseXml>

    try {
      await xapi.callAsync('SR.probe', xapiHost.$ref, deviceConfig, 'lvmoiscsi', {})

      throw new Error('the call above should have thrown an error')
    } catch (error: any) {
      if (error.code !== 'SR_BACKEND_FAILURE_107') {
        throw error
      }

      xml = parseXml(error.params[2])
    }

    const luns: XoSrIscsiLunsExport[] = ensureArray(xml['iscsi-target'].LUN).map(lun => ({
      id: lun.LUNid.trim(),
      vendor: lun.vendor.trim(),
      serial: lun.serial?.trim() || '',
      size: lun.size?.trim(),
      scsiId: lun.SCSIid.trim(),
    }))

    return luns
  }

  async probeIscsiExists(
    id: XoHost['id'],
    targetIp: string,
    targetIqn: string,
    scsiId: string,
    port?: number,
    chapUser?: string,
    chapPassword?: string
  ): Promise<string[]> {
    const xapiHost = this.#restApi.getXapiObject<XoHost>(id, 'host')
    const xapi = xapiHost.$xapi

    type DeviceConfig = {
      target: string
      targetIQN: string
      SCSIid: string
      port?: string
      chapuser?: string
      chappassword?: string
    }

    const deviceConfig: DeviceConfig = {
      target: targetIp,
      targetIQN: targetIqn,
      SCSIid: scsiId,
    }

    if (chapUser && chapPassword) {
      deviceConfig.chapuser = chapUser
      deviceConfig.chappassword = chapPassword
    }

    if (port) {
      deviceConfig.port = String(port)
    }

    const xml = parseXml(await xapi.callAsync('SR.probe', xapiHost.$ref, deviceConfig, 'lvmoiscsi', {}))

    // UUIDs of the SRs connected to this LUN
    const srs: string[] = ensureArray(xml.SRlist.SR).map(sr => sr.UUID.trim())

    return srs
  }

  async probeHbaExists(id: XoHost['id'], scsiId: string): Promise<string[]> {
    const xapiHost = this.#restApi.getXapiObject<XoHost>(id, 'host')
    const xapi = xapiHost.$xapi

    const deviceConfig = {
      SCSIid: scsiId,
    }

    const xml = parseXml(await xapi.callAsync('SR.probe', xapiHost.$ref, deviceConfig, 'lvmohba', {}))

    // get the UUID of SR connected to this LUN
    const srs: string[] = ensureArray(xml.SRlist.SR).map(sr => sr.UUID.trim())

    return srs
  }

  async probeNfsExists(id: XoHost['id'], server: string, serverPath: string, nfsVersion?: string): Promise<string[]> {
    const xapiHost = this.#restApi.getXapiObject<XoHost>(id, 'host')
    const xapi = xapiHost.$xapi

    const deviceConfig = {
      nfsversion: nfsVersion,
      server,
      serverpath: serverPath,
    }

    const xml = parseXml(await xapi.callAsync('SR.probe', xapiHost.$ref, deviceConfig, 'nfs', {}))

    const srs: string[] = ensureArray(xml.SRlist.SR).map(sr => sr.UUID.trim())

    return srs
  }
}
