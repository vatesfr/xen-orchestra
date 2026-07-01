import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { HOST_POWER_STATE, Xapi, XcpPatches, XenApiHostWrapped, XoPool, XsPatches, type XoHost } from '@vates/types'
import { incorrectState } from 'xo-common/api-errors.js'

import type { RestApi } from '../rest-api/rest-api.mjs'
import type { MissingPatchesInfo } from './host.type.mjs'
import semver from 'semver'

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
    const host = this.#restApi.getObject<XoHost>(hostId)

    if (opts?.bypassBackupCheck) {
      log.warn('host clean_shutdown called with argument "bypassBackupCheck" set to true', { hostId })
    } else {
      await this.#restApi.xoApp.backupGuard(host.$pool)
    }

    await this.#restApi.getXapiObject(hostId, 'host').$xapi.shutdownHost(hostId, opts)
  }

  async cleanRebootHost(
    hostId: XoHost['id'],
    opts: {
      force: boolean
      bypassBackupCheck: boolean
      bypassVersionCheck: boolean
    }
  ): Promise<void> {
    const { xapi } = await this.#rebootChecks(hostId, opts)

    await xapi.rebootHost(hostId, opts.force)
  }

  async smartRebootHost(
    hostId: XoHost['id'],
    opts: {
      bypassBackupCheck: boolean
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
    const host = this.#restApi.getObject<XoHost>(hostId)

    if (opts?.bypassBackupCheck) {
      log.warn('host.restartAgent called with argument "bypassBackupCheck" set to true', { hostId })
    } else {
      await this.#restApi.xoApp.backupGuard(host.$pool)
    }

    await this.#restApi.getXapiObject<XoHost>(hostId, 'host').$restartAgent()
  }

  async #rebootChecks(
    hostId: XoHost['id'],
    opts: {
      bypassBackupCheck: boolean
      bypassVersionCheck: boolean
    }
  ): Promise<{ xapi: Xapi; xapiHost: XenApiHostWrapped }> {
    const host = this.#restApi.getObject<XoHost>(hostId)
    const xapiHost = this.#restApi.getXapiObject<XoHost>(hostId, 'host')
    const poolId = host.$pool
    const xapi = xapiHost.$xapi

    if (opts.bypassBackupCheck) {
      log.warn('host.reboot called with "bypassBackupCheck" set to true', { hostId })
    } else {
      await this.#restApi.xoApp.backupGuard(poolId)
    }

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
}
