import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { HOST_POWER_STATE, XcpPatches, XsPatches, type XoHost } from '@vates/types'

import type { RestApi } from '../rest-api/rest-api.mjs'

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
      if (!host.enabled) {
        nDisabled++
        continue
      }
      switch (host.power_state) {
        case HOST_POWER_STATE.RUNNING:
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

  async getMissingPatchesInfo(opts?: { filter?: string | ((obj: XoHost) => boolean) }): Promise<
    | { hasAuthorization: false }
    | {
        hasAuthorization: true
        nHostsWithMissingPatches: number
        nPoolsWithMissingPatches: number
        nHostsFailed: number
        missingPatches: (XcpPatches | XsPatches)[]
      }
  > {
    if (!(await this.#restApi.xoApp.hasFeatureAuthorization('LIST_MISSING_PATCHES'))) {
      return {
        hasAuthorization: false,
      }
    }

    const hosts = Object.values(this.#restApi.getObjectsByType<XoHost>('host', opts))
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
      missingPatches: Array.from(missingPatches.values()),
      nHostsFailed,
      nHostsWithMissingPatches,
      nPoolsWithMissingPatches: poolsWithMissingPatches.size,
    }
  }
}
